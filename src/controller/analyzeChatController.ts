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

    const { fileHash } = request.params as { fileHash: string };

    if (!fileHash) {
      log.warn("Missing chatId");
      return reply.status(400).send({
        message: "Chat ID is required",
      });
    }

    log.info({ fileHash, userId }, "Starting analysis");

    const analysis = await analyzeChatService(fileHash, userId, { log });

    if ("status" in analysis && analysis.status === "PROCESSING") {
      log.info({ fileHash }, "Analysis in progress");
      return reply.status(202).send({
        message: "Analysis in progress",
        status: "PROCESSING",
      });
    }

    log.info({ fileHash }, "Analysis completed");

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

    const { fileHash } = request.params as { fileHash: string };

    log.info({ fileHash, userId }, "Fetching chat");

    const chat = await prisma.chat.findFirst({
      where: {  fileHash, userId },
    });

    if (!chat) {
      log.warn({ fileHash }, "Chat not found");
      return reply.status(404).send({
        message: "Chat not found",
      });
    }

    const state = await prisma.chatProcessingState.findUnique({
      where: { fileHash },
    });

    if (!state) {
      log.info({ fileHash }, "Analysis not started");
      return reply.send({
        status: "NOT_STARTED",
        rollingSummary: null,
      });
    }

    log.info({ fileHash }, "Analysis fetched");

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