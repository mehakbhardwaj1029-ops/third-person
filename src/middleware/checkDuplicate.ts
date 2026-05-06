import prisma from "../utils/prisma"
import { FastifyRequest, FastifyReply } from "fastify";

export async function checkDuplicate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const log = request.log;

  const fileHash = (request as any).fileHash;

  if (!fileHash) {
    log.info("No fileHash found, skipping duplicate check");
    return; 
  }

  log.info({ fileHash }, " Checking for duplicate upload");

  const existing = await prisma.chat.findFirst({
    where: { 
      fileHash,
      status: "ANALYZED"
    },
    include: {
      analysis: true
    }
  });

  if (existing?.analysis) {
    log.info(
      { chatId: existing.id, analysisId: existing.analysis.id },
      " Duplicate found, returning cached result"
    );

    return reply.send({
      source: "cache",
      analysisId: existing.analysis.id,
      message: "Using cached analysis from previous upload"
    });
  }

  log.info(" No duplicate found, proceeding with upload");
}