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

type Context = {
  log: any;
};

export async function analyzeChatService(
  chatId: string,
  userId: string,
  ctx: Context
) {
  const { log } = ctx;

  log.info({ chatId, userId }, "Finding chat");

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
  });

  if (!chat) {
    log.warn({ chatId }, "Chat not found");
    throw new Error("Chat not found");
  }

  log.info({ chatId }, "Marking chat as PROCESSING");

  await prisma.chat.update({
    where: { id: chatId },
    data: { status: "PROCESSING" },
  });

  log.info({ chatId }, "Fetching chunks");

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

  const { rollingSummary } = await processChunks(chat, chunks, ctx);

  log.info({ chatId }, "Saving analysis");

  await saveChatAnalysis(chat, rollingSummary);

  await saveParticipantsAndRelations(
    chat,
    userId,
    rollingSummary,
    ctx
  );

  await finalizeChat(chatId, ctx);

  log.info({ chatId }, "Analysis pipeline completed");

  return { status: "ANALYZED" };
}

async function processChunks(chat: any, chunks: any[], ctx: any) {
  const { log } = ctx;

  let rollingSummary: LLMResponse | null = null;

  for (const chunk of chunks) {
    log.info({ chunkId: chunk.id, order: chunk.order }, "Processing chunk");

    const parsed = parseChunkContent(chunk.content);

    const formatted = parsed
      .map((m) => `[${m.timestamp}] ${m.sender}: ${m.message}`)
      .join("\n");

    const guard = preLlmGuard(formatted);

    if (!guard.safeForLlm) {
      log.warn({ chatId: chat.id }, "LLM blocked due to unsafe input");

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

    log.info({ chunkId: chunk.id }, "Calling LLM");

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
        summary: response,
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
    log.error("Rolling summary missing");
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
      fileHash: chat.fileHash,
      summary: llm.summary,
      compatibilityScore: llm.compatibilityScore,
      userInsights: llm.userInsights,
      overallInsights: llm.overallInsights,
      tone: chat.tone,
    },
    create: {
      chatId: chat.id,
      fileHash: chat.fileHash,
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
  llm: LLMResponse,
  ctx: any
) {
  const { log } = ctx;

  log.info({ chatId: chat.id }, "Saving participants");

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

async function finalizeChat(chatId: string, ctx: any) {
  const { log } = ctx;

  log.info({ chatId }, "Finalizing chat");

  await prisma.chat.update({
    where: { id: chatId },
    data: {
      status: "ANALYZED",
    },
  });
}