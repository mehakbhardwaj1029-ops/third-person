import { FastifyRequest, FastifyReply } from "fastify";
import { generateHash } from '../utils/hash.utils';

export async function generateHashPreHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const log = request.log;

  log.info(" Hash generation started");

  const body = request.body as { chat: string };

  if (!body?.chat) {
    log.warn(" Chat content missing for hash generation");
    return reply.status(400).send({ error: "Chat content missing" });
  }

  const fileHash = generateHash(body.chat);

  (request as any).fileHash = fileHash;

  log.info({ fileHash }, " Hash generated successfully");
}