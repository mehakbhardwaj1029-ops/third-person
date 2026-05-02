"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatAnalysisController = exports.analyzeChatController = void 0;
require("../types/fastify.d");
const analysis_service_1 = require("../services/analysis.service");
const prisma_1 = __importDefault(require("../utils/prisma"));
// Analyze chat and fetch results
const analyzeChatController = async (request, reply) => {
    try {
        const userId = request.user?.id;
        if (!userId) {
            return reply.status(401).send({
                message: "Unauthorized",
            });
        }
        const { chatId } = request.params;
        if (!chatId) {
            return reply.status(400).send({
                message: "Chat ID is required",
            });
        }
        // Call analysis service (fileHash is fetched from DB internally)
        const analysis = await (0, analysis_service_1.analyzeChatService)(chatId, userId);
        // Handle processing response
        if ("status" in analysis && analysis.status === "PROCESSING") {
            return reply.status(202).send({
                message: "Analysis in progress",
                status: "PROCESSING",
            });
        }
        // At this point, analysis is guaranteed to be ChatAnalysis type
        const chatAnalysis = analysis;
        return reply.status(200).send({
            message: "Analysis completed successfully",
            analysisId: chatAnalysis.id,
        });
    }
    catch (error) {
        // Known business errors
        if (error.message === "Chat not found or unauthorized") {
            return reply.status(404).send({
                message: error.message,
            });
        }
        if (error.message === "No chat content available for analysis") {
            return reply.status(400).send({
                message: error.message,
            });
        }
        if (error.message?.startsWith("LLM input blocked")) {
            return reply.status(400).send({
                message: error.message,
            });
        }
        // Zod validation failure (LLM response broken)
        if (error.name === "ZodError") {
            return reply.status(500).send({
                message: "Invalid AI response format",
                errors: error.errors,
            });
        }
        // Fallback
        console.error("Analyze Chat Error:", error);
        return reply.status(500).send({
            message: "Internal Server Error",
        });
    }
};
exports.analyzeChatController = analyzeChatController;
// Get chat analysis results
const getChatAnalysisController = async (request, reply) => {
    try {
        const userId = request.user?.id;
        if (!userId) {
            return reply.status(401).send({ message: "Unauthorized" });
        }
        const { chatId } = request.params;
        const chat = await prisma_1.default.chat.findFirst({
            where: { id: chatId, userId },
        });
        if (!chat) {
            return reply.status(404).send({
                message: "Chat not found",
            });
        }
        const analysis = await prisma_1.default.chatAnalysis.findFirst({
            where: { chatId },
        });
        if (!analysis) {
            return reply.status(202).send({
                message: "Analysis not yet available",
                status: "PROCESSING",
            });
        }
        const participants = await prisma_1.default.participantAnalysis.findMany({
            where: { chatId },
        });
        return reply.send({
            analysis,
            participants,
        });
    }
    catch (error) {
        console.error("Get Analysis Error:", error);
        return reply.status(500).send({
            message: "Internal Server Error",
        });
    }
};
exports.getChatAnalysisController = getChatAnalysisController;
