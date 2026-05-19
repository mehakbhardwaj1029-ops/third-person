import { callFinalAnalysisLLM } from "./llm.mock";
import  prisma  from "../utils/prisma";

type Context = {
  log: any;
};

export async function generateFinalAnalysisService(
  fileHash: string,
  userId: string,
  ctx: Context
) {
  const { log } = ctx;

  log.info(
    { fileHash, userId },
    "Starting final synthesis"
  );

  // find chat

  const chat = await prisma.chat.findFirst({
    where: {
      fileHash,
      userId,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // fetch processing state

  const processingState =
    await prisma.chatProcessingState.findUnique({
      where: {
        fileHash,
      },
    });

  if (!processingState) {
    throw new Error(
      "Processing state missing"
    );
  }

  // already completed

  if (
    processingState.finalAnalysisGenerated
  ) {
    return {
      status: "COMPLETED",
    };
  }

  // ensure behavior evolution finished

  const behaviorEvolutionCompleted =
  processingState.lastChunkBehaviorEvolved ===
  processingState.totalChunks;

if (!behaviorEvolutionCompleted) {
  throw new Error(
    "Behavior evolution not completed"
  );
}

  // update stage

  await prisma.chatProcessingState.update({
    where: {
      fileHash,
    },

    data: {
      currentStage: "FINAL_SYNTHESIS",
    },
  });

  // fetch behavioral state

  const behavioralState =
    await prisma.behavioralState.findUnique({
      where: {
        fileHash,
      },
    });

  if (!behavioralState?.state) {
    throw new Error(
      "Behavioral state missing"
    );
  }

  // fetch summarized chunks

  // const chunks = await prisma.chunk.findMany({
  //   where: {
  //     fileHash,
  //   },

  //   orderBy: {
  //     order: "asc",
  //   },

  //   select: {
  //     order: true,
  //     summary: true,
  //   },
  // });



  log.info(
    { fileHash },
    "Generating final LLM response"
  );

  // FINAL LLM CALL

  const finalResponse =
    await callFinalAnalysisLLM({
      behavioralState:
        behavioralState.state,


      participants: chat.participants,

      userParticipant:
        chat.userParticipant,

      tone: chat.tone,
    });

  // save final chat analysis

  await prisma.chatAnalysis.upsert({
    where: {
      chatId: chat.id,
    },

    update: {
      summary: finalResponse.summary,

      compatibilityScore:
        finalResponse.compatibilityScore,

      userInsights:
        finalResponse.userInsights,

      overallInsights:
        finalResponse.overallInsights,

      tone: chat.tone,
    },

    create: {
      chatId: chat.id,

      fileHash: chat.fileHash,

      summary: finalResponse.summary,

      compatibilityScore:
        finalResponse.compatibilityScore,

      userInsights:
        finalResponse.userInsights,

      overallInsights:
        finalResponse.overallInsights,

      tone: chat.tone,
    },
  });

  // save participant analyses

  for (const participant of
    finalResponse.participants) {

    const participantRecord =
      await prisma.participant.upsert({
        where: {
          userId_name: {
            userId,
            name: participant.name,
          },
        },

        update: {},

        create: {
          userId,
          name: participant.name,
        },
      });

    await prisma.participantAnalysis.upsert({
      where: {
        chatId_participantId: {
          chatId: chat.id,
          participantId:
            participantRecord.id,
        },
      },

      update: {
        traits: participant.traits,

        emotions:
          participant.emotions,

        mbtiType:
          participant.mbti.type,

        mbtiMeta: participant.mbti,

        behaviourPatterns:
          participant.behaviourPatterns,
      },

      create: {
        chatId: chat.id,

        participantId:
          participantRecord.id,

        traits: participant.traits,

        emotions:
          participant.emotions,

        mbtiType:
          participant.mbti.type,

        mbtiMeta: participant.mbti,

        behaviourPatterns:
          participant.behaviourPatterns,
      },
    });
  }

  // mark completed

  await prisma.chatProcessingState.update({
    where: {
      fileHash,
    },

    data: {
      finalAnalysisGenerated: true,

      currentStage: "COMPLETED",
    },
  });

  // finalize chat

  await prisma.chat.update({
    where: {
      id: chat.id,
    },

    data: {
      status: "ANALYZED",
    },
  });

  log.info(
    { fileHash },
    "Final synthesis completed"
  );

  return {
    status: "COMPLETED",

    response: finalResponse,
  };
}