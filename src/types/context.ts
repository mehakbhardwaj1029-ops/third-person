import { FastifyBaseLogger } from "fastify";

export type ServiceContext = {
  log: FastifyBaseLogger;
};