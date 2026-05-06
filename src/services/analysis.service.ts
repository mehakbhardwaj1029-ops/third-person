import prisma from "../utils/prisma";
import { parseChunkContent } from "../utils/chatParser";
import { callLLM } from "./llm.mock";
import { preLlmGuard } from "../ai/preLlmGuard";
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
export async function analyzeChatService(
  chatId: string,
  userId: string
) {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
  });

  if (!chat) throw new Error("Chat not found");
  
  //check status in parallel processing

  // if (chat.status === "ANALYZED") {
  //   return { status: "ANALYZED" };
  // }

  await prisma.chat.update({
    where: { id: chatId },
    data: { status: "PROCESSING" },
  });

  const chunks = await prisma.chunk.findMany({
    where: { chatId },
    orderBy: { order: "asc" },
  });

  await prisma.chatProcessingState.upsert({
  where: { chatId },
  update: {
    status: "PROCESSING",
  },
  create: {
    chatId,
    lastChunkIndex: 0,
    rollingSummary: {},
    status: "PROCESSING",
  },
});
  const { rollingSummary, status } =
    await processChunks(chat, chunks);

  await saveChatAnalysis(chat, rollingSummary);

  await saveParticipantsAndRelations(
    chat,
    userId,
    rollingSummary
  );

  await finalizeChat(chatId);

  return { status: "ANALYZED" };
}

async function processChunks(chat: any, chunks: any[]) {
  let rollingSummary: LLMResponse | null = null;

  for (const chunk of chunks) {
    const parsed = parseChunkContent(chunk.content);

    const formatted = parsed
      .map((m) => `[${m.timestamp}] ${m.sender}: ${m.message}`)
      .join("\n");

      const guard = preLlmGuard(formatted); 

      if(!guard.safeForLlm){    // should we not break it early after getting , what if because of few spams we might loose real insights
        await prisma.chatProcessingState.update({
        where: { chatId: chat.id },
        data: {
          status: "BLOCKED",
          rollingSummary: {
            error: "Blocked due to unsafe content",
            riskLevel: guard.riskLevel,
            detectedPatterns: guard.detectedPatterns,
          },
        },
      });

      throw new Error("LLM blocked due to high-risk input");
      }

    const response: LLMResponse = await callLLM({
      text: formatted,
      participants: chat.participants,
      userParticipant: chat.userParticipant,
      tone: chat.tone,
      previousState: rollingSummary,
    });

    rollingSummary = response;

    await prisma.chunk.update({
      where: { id: chunk.id },
      data: {
        summary: response, // FULL JSON ✅
        status: "SUMMARIZED",
      },
    });

    const isLastChunk = chunk.order === chunks.length;

    

    await prisma.chatProcessingState.update({
  where: { chatId: chat.id },
  data: {
    lastChunkIndex: chunk.order,
    rollingSummary: rollingSummary,
    status: isLastChunk ? "ANALYZED" : "PROCESSING",
  },
});

  }

  if (!rollingSummary) {
    throw new Error("LLM processing failed");
  }

  return {
    rollingSummary,
    status: "ANALYZED",
  };
}

async function saveChatAnalysis(chat: any, llm: any) {  
  return prisma.chatAnalysis.upsert({
    where: { chatId: chat.id },

    update: {
      summary: llm.summary,
      compatibilityScore: llm.compatibilityScore,
      userInsights: llm.userInsights,
      overallInsights: llm.overallInsights,
      tone: chat.tone,
    },

    create: {
      chatId: chat.id,
      summary: llm.summary,
      compatibilityScore: llm.compatibilityScore,
      userInsights: llm.userInsights,
      overallInsights: llm.overallInsights,
      tone: chat.tone,
    },
  });
}

async function saveParticipantsAndRelations(
  chat: any,
  userId: string,
  llm: LLMResponse
) {
  for (const p of llm.participants) {
    const participant = await prisma.participant.upsert({
      where: {
        userId_name: {
          userId,
          name: p.name,
        },
      },
      update: {},
      create: {
        userId,
        name: p.name,
      },
    });

    await prisma.chatParticipant.upsert({
      where: {
        chatId_participantId: {
          chatId: chat.id,
          participantId: participant.id,
        },
      },
      update: {},
      create: {
        chatId: chat.id,
        participantId: participant.id,
      },
    });

    await prisma.participantAnalysis.upsert({
      where: {
        chatId_participantId: {
          chatId: chat.id,
          participantId: participant.id,
        },
      },
      update: {
        traits: p.traits,
        emotions: p.emotions,
        mbtiType: p.mbti.type,
        mbtiMeta: p.mbti,
        behaviourPatterns: p.behaviourPatterns,
      },
      create: {
        chatId: chat.id,
        participantId: participant.id,
        traits: p.traits,
        emotions: p.emotions,
        mbtiType: p.mbti.type,
        mbtiMeta: p.mbti,
        behaviourPatterns: p.behaviourPatterns,
      },
    });
  }
}

async function finalizeChat(chatId: string) {
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      status: "ANALYZED",
    },
  });
}