import prisma from "../utils/prisma";
import { parseChunkContent } from "../utils/chatParser";
import { callChunkAnalysisLLM } from "./llm.mock";
import { preLlmGuard } from "../ai/preLlmGuard";
import { analyzeOptimization, optimizeChunkForLLM } from "./tokenOptimization.service";
import { BehavioralState, createEmptyBehavioralState, evolveBehavioralState } from './behaviourEvolution.service';
import { generateFinalAnalysisService } from "./generateFinalAnalysis.service";

type ChunkAnalysis = {
  summary: string;

  signals: {
    emotions: string[];
    relationshipSignals: string[];
    communicationPatterns: string[];
  };

  participants: {
    name: string;

    detectedTraits: string[];

    emotionalIndicators: string[];

    behaviorPatterns: string[];

    mbtiEvidence: string[];
  }[];

  importantEvents: string[];
};

type LLMResponse = {
  summary: string;

  compatibilityScore: number;

  userInsights: {
    warnings: string[];
    suggestions: string[];
    behavioralAdvice: string[];
  };

  overallInsights: {
    relationshipType: string;
    communicationStyle: string;
    riskLevel: string;
    keyObservations: string[];
  };

  participants: {
    name: string;

    traits: {
      positive: string[];
      negative: string[];
    };

    emotions: {
      dominant: string[];
      secondary: string[];
    };

    mbti: {
      type: string;
      confidence: number;
      explanation: string;
    };

    behaviourPatterns: string[];
  }[];
};

type Context = {
  log: any;
};

export async function analyzeChatService(
  fileHash: string,
  userId: string,
  ctx: Context
) {
  const { log } = ctx;

  log.info({ fileHash, userId }, "Finding chat");

  const chat = await prisma.chat.findFirst({
    where: {
      fileHash,
      userId,
    },
  });

  if (!chat) {
    log.warn({ fileHash }, "Chat not found");
    throw new Error("Chat not found");
  }

  log.info({ fileHash }, "Fetching processing state");

  const processingState =
    await prisma.chatProcessingState.findUnique({
      where: {
        fileHash,
      },
    });

  const summarizedUntil =
    processingState?.lastChunkSummarized || 0;

  const evolvedUntil =
    processingState?.lastChunkBehaviorEvolved || 0;

  const finalGenerated =
    processingState?.finalAnalysisGenerated || false;

    if (finalGenerated) {
    return {
      status: "COMPLETED",
    };
  }

// chunk analysis + behavior evolution done
// final synthesis still pending
 
  const totalChunks =
  processingState?.totalChunks || 0;

const behaviorEvolutionCompleted =
  summarizedUntil === totalChunks &&
  evolvedUntil === totalChunks;

if (
  behaviorEvolutionCompleted &&
  !finalGenerated
) {

  const finalResponse =
    await generateFinalAnalysisService(
      fileHash,
      userId,
      ctx
    );

  return {
    status: finalResponse.status,
    response: finalResponse.response,
  };
}

  log.info({ fileHash }, "Fetching chunks");

  const chunks = await prisma.chunk.findMany({
    where: {
      fileHash,
    },
    orderBy: {
      order: "asc",
    },
  });

  const lastChunk =
    chunks[chunks.length - 1];
  

  log.info({ fileHash }, "Marking chat as PROCESSING");

  await prisma.chat.updateMany({
    where: {
      fileHash,
      userId,
    },
    data: {
      status: "PROCESSING",
    },
  });

  await prisma.chatProcessingState.update({
  where: {
    fileHash,
  },

  data: {
    currentStage: "CHUNK_ANALYSIS",
  },
});

  const response = await processChunks(
    chat,
    chunks,
    evolvedUntil,
    ctx
  );

  log.info(
    { fileHash },
    "Chunk processing completed"
  );

  const finalResponse = await generateFinalAnalysisService(
    fileHash,
    userId,
    ctx
  );

  return {
    status: finalResponse.status,
    response: finalResponse.response
  };
}

async function processChunks(
  chat: any,
  chunks: any[],
  evolvedUntil: number,
  ctx: any
) {
  const { log } = ctx;

  // initialize empty evolving state
  let behavioralState: BehavioralState =
    createEmptyBehavioralState();

  // load ancestor behavioral state
  if (
    chat.resumeFromChunk > 0 &&
    chat.ancestorFileHash
  ) {
    const ancestorBehavioralState =
      await prisma.behavioralState.findUnique({
        where: {
          fileHash: chat.ancestorFileHash,
        },
      });

    if (ancestorBehavioralState?.state) {
      behavioralState =
        ancestorBehavioralState.state as BehavioralState;
    }
  }

  // combine ancestor resume logic
  // + crash recovery logic

  const recoveryPoint = Math.max(
    chat.resumeFromChunk,
    evolvedUntil
  );

  const chunksToProcess = chunks.filter(
    (chunk) => chunk.order > recoveryPoint
  );

  // no work remaining
  if (chunksToProcess.length === 0) {
    return {
      currentStage: "BEHAVIOR_EVOLVED",
    };
  }

  for (const chunk of chunksToProcess) {
    log.info(
      {
        chunkId: chunk.id,
        order: chunk.order,
      },
      "Processing chunk"
    );

    const parsed = parseChunkContent(
      chunk.content
    );

    const original = parsed
      .map(
        (m) =>
          `[${m.timestamp}] ${m.sender}: ${m.message}`
      )
      .join("\n");

    const optimized =
      optimizeChunkForLLM(parsed);

    const stats = analyzeOptimization(
      original,
      optimized
    );

    log.info(
      {
        chunkId: chunk.id,
        stats,
      },
      "Chunk optimization stats"
    );

    const guard = preLlmGuard(optimized);

    if (!guard.safeForLlm) {
      log.warn(
        { fileHash: chat.fileHash },
        "LLM blocked due to unsafe input"
      );

      await prisma.chatProcessingState.update({
        where: {
          fileHash: chat.fileHash,
        },

        data: {
          currentStage: "BLOCKED",

          recoverableError: {
            reason: "Unsafe content",
            riskLevel: guard.riskLevel,
            detectedPatterns:
              guard.detectedPatterns,
          },
        },
      });

      throw new Error(
        "LLM blocked due to high-risk input"
      );
    }

    log.info(
      { chunkId: chunk.id },
      "Calling LLM"
    );

    const chunkAnalysis: ChunkAnalysis =
      await callChunkAnalysisLLM({
        text: optimized,
        participants: chat.participants,
        userParticipant:
          chat.userParticipant,
        tone: chat.tone,
      });

    // SAVE CHUNK SUMMARY FIRST
    // if crash happens later,
    // we don't need to rerun LLM

    await prisma.chunk.update({
      where: {
        fileHash_order: {
          fileHash: chat.fileHash,
          order: chunk.order,
        },
      },

      data: {
        summary: chunkAnalysis,
        status: "SUMMARIZED",
      },
    });

    // update summarized checkpoint

    await prisma.chatProcessingState.update({
      where: {
        fileHash: chat.fileHash,
      },

      data: {
        lastChunkSummarized:
          chunk.order,

        currentStage:
          "CHUNK_ANALYZED",
      },
    });

    // evolve behavioral state

    behavioralState =
      await evolveBehavioralState(
        behavioralState,
        chunkAnalysis
      );

    // persist behavioral state

    await prisma.behavioralState.upsert({
      where: {
        fileHash: chat.fileHash,
      },

      update: {
        state: behavioralState,
      },

      create: {
        fileHash: chat.fileHash,

        conversationHash:
          chat.conversationHash,

        state: behavioralState,
      },
    });

    // update behavior evolution checkpoint

    const isLastChunk =
      chunk.order ===
      chunksToProcess[
        chunksToProcess.length - 1
      ].order;

    await prisma.chatProcessingState.update({
      where: {
        fileHash: chat.fileHash,
      },

      data: {
        lastChunkBehaviorEvolved:
          chunk.order,

        finalAnalysisGenerated: false,

        currentStage: isLastChunk
          ? "BEHAVIOR_EVOLVED"
          : "BEHAVIOR_EVOLUTION",

        messageCount:
          chat.messageCount,
      },
    });
  }

  return {
    currentStage: "BEHAVIOR_EVOLVED",
  };
}

