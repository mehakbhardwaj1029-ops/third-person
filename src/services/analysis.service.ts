import { preLlmGuard } from "../ai/preLlmGuard";
import { chatAnalysisSchema } from "../schemas/analysis.schema";
import { callLLM } from "./llm.service";
import { generateHash } from "../utils/hash.utils";
import prisma from "../utils/prisma";

type ChatWithChunks = NonNullable<
  Awaited<ReturnType<typeof getChatWithChunks>>
>;

async function getChatWithChunks(chatId: string, userId: string) {
  return prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
    include: {
      chunks: {
        orderBy: {
          order: "asc",
        },
      },
      analysis: true,
    },
  });
}

function buildAggregatedChunkText(chat: ChatWithChunks) {
  const aggregateFromChunks = chat.chunks
    .map((chunk) => chunk.content)
    .join("\n\n")
    .trim();

  return aggregateFromChunks || chat.rawText || "";
}

async function findAnalyzedChatByHash(fileHash: string, currentChatId: string) {
  return prisma.chat.findFirst({
    where: {
      fileHash,
      status: "ANALYZED",
      NOT: {
        id: currentChatId,
      },
    },
    include: {
      analysis: true,
      participantAnalysis: {
        include: {
          participant: true,
        },
      },
    },
  });
}

async function copyCachedAnalysis(params: {
  sourceChat: NonNullable<Awaited<ReturnType<typeof findAnalyzedChatByHash>>>;
  targetChat: ChatWithChunks;
  fileHash: string;
}) {
  const { sourceChat, targetChat, fileHash } = params;

  if (!sourceChat.analysis) {
    throw new Error("Cached analysis missing");
  }

  const existingAnalysis = await prisma.chatAnalysis.findUnique({
    where: {
      chatId: targetChat.id,
    },
  });

  if (existingAnalysis) {
    await prisma.chat.update({
      where: {
        id: targetChat.id,
      },
      data: {
        fileHash,
        status: "ANALYZED",
      },
    });

    return existingAnalysis;
  }

  return prisma.$transaction(async (tx) => {
    const analysis = await tx.chatAnalysis.create({
      data: {
        chatId: targetChat.id,
        summary: sourceChat.analysis!.summary,
        compatibilityScore: sourceChat.analysis!.compatibilityScore,
        userInsights: sourceChat.analysis!.userInsights as any,
        overallInsights: sourceChat.analysis!.overallInsights as any,
        tone: sourceChat.analysis!.tone,
      },
    });

    for (const cachedParticipant of sourceChat.participantAnalysis) {
      const participant = await tx.participant.upsert({
        where: {
          userId_name: {
            userId: targetChat.userId,
            name: cachedParticipant.participant.name,
          },
        },
        update: {},
        create: {
          name: cachedParticipant.participant.name,
          userId: targetChat.userId,
        },
      });

      await tx.chatParticipant.upsert({
        where: {
          chatId_participantId: {
            chatId: targetChat.id,
            participantId: participant.id,
          },
        },
        update: {},
        create: {
          chatId: targetChat.id,
          participantId: participant.id,
        },
      });

      await tx.participantAnalysis.create({
        data: {
          chatId: targetChat.id,
          participantId: participant.id,
          traits: cachedParticipant.traits as any,
          emotions: cachedParticipant.emotions as any,
          mbtiType: cachedParticipant.mbtiType,
          mbtiMeta: cachedParticipant.mbtiMeta as any,
          behaviourPatterns: cachedParticipant.behaviourPatterns as any,
        },
      });
    }

    await tx.chat.update({
      where: {
        id: targetChat.id,
      },
      data: {
        fileHash,
        status: "ANALYZED",
      },
    });

    return analysis;
  });
}

export async function analyzeChatService(chatId: string, userId: string) {
  const chat = await getChatWithChunks(chatId, userId);

  if (!chat) {
    throw new Error("Chat not found or unauthorized");
  }

  if (chat.analysis && chat.status === "ANALYZED") {
    return chat.analysis;
  }

  const aggregatedText = buildAggregatedChunkText(chat);

  if (!aggregatedText) {
    throw new Error("No chat content available for analysis");
  }

  const aggregateFileHash = generateHash(aggregatedText);

  const cachedChat = await findAnalyzedChatByHash(aggregateFileHash, chat.id);

  if (cachedChat?.analysis) {
    return copyCachedAnalysis({
      sourceChat: cachedChat,
      targetChat: chat,
      fileHash: aggregateFileHash,
    });
  }

  const processingChat = await prisma.chat.findFirst({
    where: {
      fileHash: aggregateFileHash,
      status: "PROCESSING",
      NOT: {
        id: chat.id,
      },
    },
  });

  if (processingChat) {
    return {
      status: "PROCESSING",
      message: "Analysis in progress, try again shortly",
    };
  }

  await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      fileHash: aggregateFileHash,
      status: "PROCESSING",
    },
  });

  try {
    const guard = preLlmGuard(aggregatedText);

    if (!guard.safeForLlm) {
      throw new Error(`LLM input blocked: ${guard.warnings.join(" ")}`);
    }

    if (guard.warnings.length > 0) {
      console.warn("Pre-LLM guard warnings:", guard.warnings);
    }

    const llmResponse = await callLLM({
      text: guard.compressedText,
      participants: chat.participants ?? [],
      userParticipant: chat.userParticipant ?? null,
      tone: chat.tone ?? "COACH",
    });

    const parsed = chatAnalysisSchema.parse(llmResponse);

    return prisma.$transaction(async (tx) => {
      const analysis = await tx.chatAnalysis.create({
        data: {
          chatId: chat.id,
          summary: parsed.summary,
          compatibilityScore: parsed.compatibilityScore,
          userInsights: parsed.userInsights,
          overallInsights: parsed.overallInsights,
          tone: chat.tone,
        },
      });

      for (const analyzedParticipant of parsed.participants) {
        const participant = await tx.participant.upsert({
          where: {
            userId_name: {
              userId: chat.userId,
              name: analyzedParticipant.name,
            },
          },
          update: {},
          create: {
            name: analyzedParticipant.name,
            userId: chat.userId,
          },
        });

        await tx.chatParticipant.upsert({
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

        await tx.participantAnalysis.create({
          data: {
            chatId: chat.id,
            participantId: participant.id,
            traits: analyzedParticipant.traits,
            emotions: analyzedParticipant.emotions,
            mbtiType: analyzedParticipant.mbti.type,
            mbtiMeta: analyzedParticipant.mbti,
            behaviourPatterns: analyzedParticipant.behaviourPatterns,
          },
        });
      }

      await tx.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          fileHash: aggregateFileHash,
          status: "ANALYZED",
        },
      });

      return analysis;
    });
  } catch (error) {
    await prisma.chat.update({
      where: {
        id: chat.id,
      },
      data: {
        status: "CHUNKED",
      },
    });

    throw error;
  }
}
