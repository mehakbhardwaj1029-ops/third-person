import { FastifyRequest, FastifyReply } from "fastify";
import '../types/fastify.d';
import { analyzeChatService } from "../services/analysis.service";
import prisma from "../utils/prisma";

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

    const analysis = await analyzeChatService(chatId, userId);

    if ("status" in analysis && analysis.status === "PROCESSING") {
      return reply.status(202).send({
        message: "Analysis in progress",
        status: "PROCESSING",
      });
    }
    
    return reply.status(200).send({
      message: "Analysis completed successfully",
    });

  } catch (error: any) {

    if (error.message === "Chat not found or unauthorized") {
      return reply.status(404).send({
        message: error.message,
      });
    }

    if (error.name === "ZodError") {
      return reply.status(500).send({
        message: "Invalid AI response format",
        errors: error.errors,
      });
    }

    console.error("Analyze Chat Error:", error);

    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
};

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

    const state = await prisma.chatProcessingState.findUnique({
      where: { chatId },
    });

    if (!state) {
      return reply.send({
        status: "NOT_STARTED",
        rollingSummary: null,
      });
    }

    return reply.send({
      status: state.status,
      rollingSummary: state.rollingSummary,
      lastChunkIndex: state.lastChunkIndex,
    });

  } catch (error: any) {
    console.error("Get Analysis Error:", error);

    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
};