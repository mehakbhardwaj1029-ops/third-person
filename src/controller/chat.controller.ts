import { FastifyRequest, FastifyReply } from "fastify";
import { getAllChatsService } from "../services/chat.service";

export const getAllChatsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const log = request.log;

  try {
    log.info(" Get all chats request received");

    const userId = (request.user as { id: string }).id;

    if (!userId) {
      log.warn("Unauthorized access attempt");
      return reply.status(401).send({ message: "Unauthorized" });
    }

    log.info({ userId }, "Fetching chat history");

    const chats = await getAllChatsService(userId, { log });

    log.info({ userId, count: chats.length }, "Chats fetched successfully");

    return reply.status(200).send({
      chats,
    });

  } catch (error: any) {
    log.error(error, "Failed to fetch chats");

    return reply.status(500).send({
      message: "Internal server error",
    });
  }
};