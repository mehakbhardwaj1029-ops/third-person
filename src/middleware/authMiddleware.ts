import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const log = request.log;

  try {
    log.info("Auth middleware triggered");

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      log.warn("No token provided");
      return reply.status(401).send({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    request.user = {
      id: decoded.userId,
    };

    log.info({ userId: decoded.userId }, "Auth successful");

  } catch (error) {
    log.warn("Invalid token");
    return reply.status(401).send({ message: "Invalid token" });
  }
}