import prisma from "../utils/prisma"
import { FastifyRequest, FastifyReply } from "fastify";


export async function checkDuplicate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const fileHash = (request as any).fileHash;

  if (!fileHash) {
    return; 
  }

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
    return reply.send({
      source: "cache",
      analysisId: existing.analysis.id,
      message: "Using cached analysis from previous upload"
    });
  }
}