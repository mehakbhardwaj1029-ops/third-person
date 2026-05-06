import { FastifyRequest, FastifyReply } from "fastify";
import { getAllChatsService } from "../services/chat.service";

export const getAllChatsController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (request.user as { id: string }).id;

    if (!userId) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    const chats = await getAllChatsService(userId);

    return reply.status(200).send({
      chats,
    });

  } catch (error: any) {
    request.log.error(error);

    return reply.status(500).send({
      message: "Internal server error",
    });
  }
};