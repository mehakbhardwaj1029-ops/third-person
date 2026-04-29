import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const prisma = new PrismaClient();

export default prisma;