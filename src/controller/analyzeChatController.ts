import { FastifyRequest, FastifyReply } from "fastify";
import { analyzeChatService } from "../services/analysis.service";
import prisma from "../utils/prisma";

export const analyzeChatController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const log = request.log;

  try {
    log.info("Analyze chat request received");

    const userId = (request.user as { id: string } | undefined)?.id;

    if (!userId) {
      log.warn("Unauthorized access attempt");
      return reply.status(401).send({
        message: "Unauthorized",
      });
    }

    const { chatId } = request.params as { chatId: string };

    if (!chatId) {
      log.warn("Missing chatId");
      return reply.status(400).send({
        message: "Chat ID is required",
      });
    }

    log.info({ chatId, userId }, "Starting analysis");

    const analysis = await analyzeChatService(chatId, userId, { log });

    if ("status" in analysis && analysis.status === "PROCESSING") {
      log.info({ chatId }, "Analysis in progress");
      return reply.status(202).send({
        message: "Analysis in progress",
        status: "PROCESSING",
      });
    }

    log.info({ chatId }, "Analysis completed");

    return reply.status(200).send({
      message: "Analysis completed successfully",
    });

  } catch (error: any) {
    log.error(error, "Failed to analyze file");

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

    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
};



export const getChatAnalysisController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const log = request.log;

  try {
    log.info("Get chat analysis request received");

    const userId = (request.user as { id: string } | undefined)?.id;

    if (!userId) {
      log.warn("Unauthorized access");
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const { chatId } = request.params as { chatId: string };

    log.info({ chatId, userId }, "Fetching chat");

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      log.warn({ chatId }, "Chat not found");
      return reply.status(404).send({
        message: "Chat not found",
      });
    }

    const state = await prisma.chatProcessingState.findUnique({
      where: { chatId },
    });

    if (!state) {
      log.info({ chatId }, "Analysis not started");
      return reply.send({
        status: "NOT_STARTED",
        rollingSummary: null,
      });
    }

    log.info({ chatId }, "Analysis fetched");

    return reply.send({
      status: state.status,
      rollingSummary: state.rollingSummary,
      lastChunkIndex: state.lastChunkIndex,
    });

  } catch (error: any) {
    log.error(error, "Error while fetching summary");

    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
};