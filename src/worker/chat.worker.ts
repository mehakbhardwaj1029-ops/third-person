// import { Worker } from "bullmq";
// import prisma from "../utils/prisma";
// import { buildChunksWithHash } from "../utils/chunker.util";
// import { callLLM } from "../services/llm.mock"; 

// const connection = {
//   host: "127.0.0.1",
//   port: 6379,
// };

// const chatWorker = new Worker(
//   "chat-processing",
//   async (job) => {
//     console.log(" Job received:", job.id, job.data);

//     const { chatId } = job.data;

//     // Fetch chat
//     const chat = await prisma.chat.findUnique({
//       where: { id: chatId },
//     });

//     if (!chat) {
//       throw new Error("Chat not found in worker");
//     }

//     const messages = chat.parsedJson as any[];

//     if (!messages || messages.length === 0) {
//       throw new Error("No parsed messages found");
//     }

//     // Chunking
//     const chunks = buildChunksWithHash(messages);

//     console.log(` Total chunks: ${chunks.length}`);

//     let rollingSummary = "";

//     for (let i = 0; i < chunks.length; i++) {
//       const chunk = chunks[i];

//       console.log(` Processing chunk ${i}`);

//       const llmResponse = await callLLM({
//         text: JSON.stringify(chunk.messages),
//         participants: chat.participants ?? [],
//         userParticipant: chat.userParticipant ?? null,
//         tone: chat.tone ?? "COACH",
//       });

//       console.log(" LLM summary:", llmResponse.summary);

//       // simple rolling summary (temporary)
//       rollingSummary = llmResponse.summary;
//     }

//     //  Save final result 
//     await prisma.chatAnalysis.create({
//       data: {
//         chatId,
//         summary: rollingSummary,
//         compatibilityScore: 75,
//         userInsights: {},
//         overallInsights: {},
//         tone: chat.tone,
//       },
//     });

//     // Mark ANALYZED
//     await prisma.chat.update({
//       where: { id: chatId },
//       data: { status: "ANALYZED" },
//     });

//     console.log(" Job completed for chat:", chatId);
//   },
//   { connection }
// );

// // Events
// chatWorker.on("completed", (job) => {
//   console.log(` Job ${job.id} completed`);
// });

// chatWorker.on("failed", (job, err) => {
//   console.error(` Job ${job?.id} failed:`, err);
// });