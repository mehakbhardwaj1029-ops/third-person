import { FastifyRequest, FastifyReply } from "fastify";
import { getAllChatsService } from "../services/chat.service";

type GetAllChatsQuery = {
  limit?: string;
  cursor?: string;
  sortOrder?: "asc" | "desc";
  search?: string;

};

export const getAllChatsController = async (
  request: FastifyRequest<{
    Querystring: GetAllChatsQuery;
  }>,
  reply: FastifyReply
) => {
  const log = request.log;

  try {
    log.info("Get all chats request received");

    const userId = (request.user as { id: string }).id;

    if (!userId) {
      log.warn("Unauthorized access attempt");

      return reply.status(401).send({
        message: "Unauthorized",
      });
    }

    const {
      limit: rawLimit,
      cursor,
      sortOrder: rawSortOrder,
      search,
    } = request.query;

    // Safe limit parsing
    const limit = Math.min(
      Math.max(Number(rawLimit) || 20, 1),
      50
    );

    // Default sorting = newest first
    const sortOrder =
      rawSortOrder === "asc"
        ? "asc"
        : "desc";

    log.info(
      {
        userId,
        limit,
        cursor,
        sortOrder,
        search
      },
      "Fetching chat history"
    );

    const result = await getAllChatsService(
      userId,
      limit,
      cursor,
      sortOrder,
      search,
     {log}
    );

    log.info(
      {
        userId,
        count: result.chats.length,
        nextCursor: result.nextCursor,
      },
      "Chats fetched successfully"
    );

    return reply.status(200).send(result);

  } catch (error: any) {

    log.error(error, "Failed to fetch chats");

    return reply.status(500).send({
      message: "Internal server error",
    });
  }
};