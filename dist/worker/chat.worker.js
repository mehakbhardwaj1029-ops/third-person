"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const preLlmGuard_1 = require("../ai/preLlmGuard");
const prisma_1 = __importDefault(require("../utils/prisma"));
const chunker_util_1 = require("../utils/chunker.util");
const llm_mock_1 = require("../services/llm.mock"); // 👈 USE MOCK FOR NOW
const connection = {
    host: "127.0.0.1",
    port: 6379,
};
const chatWorker = new bullmq_1.Worker("chat-processing", async (job) => {
    console.log("🔥 Job received:", job.id, job.data);
    const { chatId } = job.data;
    // Fetch chat
    const chat = await prisma_1.default.chat.findUnique({
        where: { id: chatId },
    });
    if (!chat) {
        throw new Error("Chat not found in worker");
    }
    const messages = chat.parsedJson;
    if (!messages || messages.length === 0) {
        throw new Error("No parsed messages found");
    }
    // Chunking
    const chunks = (0, chunker_util_1.buildChunksWithHash)(messages);
    console.log(`📦 Total chunks: ${chunks.length}`);
    let rollingSummary = "";
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`➡️ Processing chunk ${i}`);
        const guard = (0, preLlmGuard_1.preLlmGuard)(JSON.stringify(chunk.messages));
        if (!guard.safeForLlm) {
            throw new Error(`LLM input blocked: ${guard.warnings.join(" ")}`);
        }
        if (guard.warnings.length > 0) {
            console.warn("Pre-LLM guard warnings:", guard.warnings);
        }
        const llmResponse = await (0, llm_mock_1.callLLM)({
            text: guard.compressedText,
            participants: chat.participants ?? [],
            userParticipant: chat.userParticipant ?? null,
            tone: chat.tone ?? "COACH",
        });
        console.log(" LLM summary:", llmResponse.summary);
        // simple rolling summary (temporary)
        rollingSummary = llmResponse.summary;
    }
    //  Save final result 
    await prisma_1.default.chatAnalysis.create({
        data: {
            chatId,
            summary: rollingSummary,
            compatibilityScore: 75,
            userInsights: {},
            overallInsights: {},
            tone: chat.tone,
        },
    });
    // Mark ANALYZED
    await prisma_1.default.chat.update({
        where: { id: chatId },
        data: { status: "ANALYZED" },
    });
    console.log("✅ Job completed for chat:", chatId);
}, { connection });
// Events
chatWorker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});
chatWorker.on("failed", (job, err) => {
    console.error(` Job ${job?.id} failed:`, err);
});
