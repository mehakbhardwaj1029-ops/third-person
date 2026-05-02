import { FastifyRequest, FastifyReply } from "fastify";
import '../types/fastify.d';
import { analyzeChatService } from "../services/analysis.service";
import prisma from "../utils/prisma";

// Analyze chat and fetch results
export const analyzeChatController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { id: string } | undefined)?.id;

    if (!userId) {
      return reply.status(401).send({
        message: "Unauthorized",
      });
    }

    const { chatId } = request.params as { chatId: string };

    if (!chatId) {
      return reply.status(400).send({
        message: "Chat ID is required",
      });
    }

    // Call analysis service (fileHash is fetched from DB internally)
    const analysis = await analyzeChatService(chatId, userId);

    // Handle processing response
    if ("status" in analysis && analysis.status === "PROCESSING") {
      return reply.status(202).send({
        message: "Analysis in progress",
        status: "PROCESSING",
      });
    }

    // At this point, analysis is guaranteed to be ChatAnalysis type
    const chatAnalysis = analysis as { id: string; [key: string]: any };
    
    return reply.status(200).send({
      message: "Analysis completed successfully",
      analysisId: chatAnalysis.id,
    });

  } catch (error: any) {

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

// Get chat analysis results
export const getChatAnalysisController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { id: string } | undefined)?.id;

    if (!userId) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const { chatId } = request.params as { chatId: string };

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return reply.status(404).send({
        message: "Chat not found",
      });
    }

    const analysis = await prisma.chatAnalysis.findFirst({
      where: { chatId },
    });

    if (!analysis) {
      return reply.status(202).send({
        message: "Analysis not yet available",
        status: "PROCESSING",
      });
    }

    const participants = await prisma.participantAnalysis.findMany({
      where: { chatId },
    });

    return reply.send({
      analysis,
      participants,
    });
  } catch (error: any) {
    console.error("Get Analysis Error:", error);
    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
};
