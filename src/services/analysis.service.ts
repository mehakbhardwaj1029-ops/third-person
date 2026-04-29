import prisma from "../utils/prisma";
import { chatQueue } from "../queues/chat.queue";


export async function analyzeChatService(chatId: string, userId: string) {

  // 1. Fetch chat and verify ownership
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId: userId,
    },
  });

  if (!chat) {
    throw new Error("Chat not found or unauthorized");
  }

  const { fileHash } = chat;

  // 2. Check if ANY chat with same fileHash is already ANALYZED
  const analyzedChat = await prisma.chat.findFirst({
    where: {
      fileHash: fileHash,
      status: "ANALYZED",
    },
    include: {
      analysis: true,
    },
  });

  // If found, return existing analysis (deduplication)
  if (analyzedChat?.analysis) {
  // attach analysis to current chat (optional but cleaner)
  await prisma.chatAnalysis.create({
    data: {
      chatId: chat.id,
      summary: analyzedChat.analysis.summary,
      compatibilityScore: analyzedChat.analysis.compatibilityScore,
      userInsights: analyzedChat.analysis.userInsights,
      overallInsights: analyzedChat.analysis.overallInsights,
      tone: analyzedChat.analysis.tone,
    },
  });

  await prisma.chat.update({
    where: { id: chat.id },
    data: { status: "ANALYZED" },
  });

  return analyzedChat.analysis;
}

  // 3. Check if ANY chat with same fileHash is currently PROCESSING
  const processingChat = await prisma.chat.findFirst({
    where: {
      fileHash: fileHash,
      status: "PROCESSING",
    },
  });

  // Return early if analysis is in progress
  if (processingChat) {
    return {
      status: "PROCESSING",
      message: "Analysis in progress, try again shortly",
    };
  }

  // 4. Mark current chat as PROCESSING 
  const updated = await prisma.chat.updateMany({
  where: {
    id: chat.id,
    status: "UPLOADED",
  },
  data: {
    status: "PROCESSING",
  },
});

if (updated.count === 0) {
  return {
    status: "PROCESSING",
    message: "Already being processed",
  };
}

await chatQueue.add("analyze-chat", {
  chatId: chat.id,
  userId: chat.userId,
  fileHash: chat.fileHash

});

await chatQueue.add(
  "analyze-chat",
  {
    chatId: chat.id,
    userId: chat.userId,
    fileHash: chat.fileHash,
  },
  {
    jobId: chat.fileHash, // prevents duplicate jobs
  })

return {
  status: "PROCESSING",
  message: "Analysis started",
};
  // try {
  //   // 5. Prepare input for LLM
  //   const inputText =
  //     typeof chat.parsedJson === "object"
  //       ? JSON.stringify(chat.parsedJson)
  //       : chat.rawText;

  //   // Limit size for LLM
  //   const MAX_CHARS = 20000;
  //   const safeText =
  //     inputText.length > MAX_CHARS
  //       ? inputText.slice(-MAX_CHARS)
  //       : inputText;

  //   // 6. Call LLM
  //   const llmResponse = await callLLM({
  //     text: safeText,
  //     participants: chat.participants ?? [],
  //     userParticipant: chat.userParticipant ?? null,
  //     tone: chat.tone ?? "COACH",
  //   });

  //   // 7. Validate LLM response
  //   const parsed = chatAnalysisSchema.parse(llmResponse);

  //   // 8. Store everything in transaction
  //   return await prisma.$transaction(async (tx) => {

  //     const analysis = await tx.chatAnalysis.create({
  //       data: {
  //         chatId: chat.id,
  //         summary: parsed.summary,
  //         compatibilityScore: parsed.compatibilityScore,
  //         userInsights: parsed.userInsights,
  //         overallInsights: parsed.overallInsights,
  //         tone: chat.tone,
  //       },
  //     });

  //     for (const p of parsed.participants) {

  //       const participant = await tx.participant.upsert({
  //         where: {
  //           userId_name: {
  //             userId: chat.userId,
  //             name: p.name,
  //           },
  //         },
  //         update: {},
  //         create: {
  //           name: p.name,
  //           userId: chat.userId,
  //         },
  //       });

  //       await tx.chatParticipant.upsert({
  //         where: {
  //           chatId_participantId: {
  //             chatId: chat.id,
  //             participantId: participant.id,
  //           },
  //         },
  //         update: {},
  //         create: {
  //           chatId: chat.id,
  //           participantId: participant.id,
  //         },
  //       });

  //       await tx.participantAnalysis.create({
  //         data: {
  //           chatId: chat.id,
  //           participantId: participant.id,
  //           traits: p.traits,
  //           emotions: p.emotions,
  //           mbtiType: p.mbti.type,
  //           mbtiMeta: p.mbti,
  //           behaviourPatterns: p.behaviourPatterns,
  //         },
  //       });
  //     }

  //     // 9. Mark as ANALYZED after successful processing
  //     await tx.chat.update({
  //       where: { id: chat.id },
  //       data: { status: "ANALYZED" },
  //     });

  //     return analysis;
  //   });

  // } catch (error) {
  //   // 10. Reset status on failure (allows retry)
  //   await prisma.chat.update({
  //     where: { id: chat.id },
  //     data: { status: "UPLOADED" },
  //   });

  //   throw error;
  }
