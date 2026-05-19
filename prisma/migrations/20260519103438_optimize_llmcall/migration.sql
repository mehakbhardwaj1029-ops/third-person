/*
  Warnings:

  - You are about to drop the column `lastChunkIndex` on the `chat_processing_state` table. All the data in the column will be lost.
  - You are about to drop the column `rollingSummary` on the `chat_processing_state` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `chat_processing_state` table. All the data in the column will be lost.
  - Added the required column `currentStage` to the `chat_processing_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalChunks` to the `chat_processing_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `chat_processing_state` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnalysisStage" AS ENUM ('UPLOADED', 'CHUNK_ANALYSIS', 'CHUNK_ANALYZED', 'BEHAVIOR_EVOLUTION', 'BEHAVIOR_EVOLVED', 'FINAL_SYNTHESIS', 'COMPLETED', 'BLOCKED', 'FAILED');

-- AlterTable
ALTER TABLE "chat_processing_state" DROP COLUMN "lastChunkIndex",
DROP COLUMN "rollingSummary",
DROP COLUMN "status",
ADD COLUMN     "currentStage" "AnalysisStage" NOT NULL,
ADD COLUMN     "finalAnalysisGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastChunkBehaviorEvolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastChunkSummarized" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recoverableError" JSONB,
ADD COLUMN     "totalChunks" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "behavioral_state" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "conversationHash" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "analysisVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "behavioral_state_fileHash_key" ON "behavioral_state"("fileHash");

-- CreateIndex
CREATE INDEX "behavioral_state_conversationHash_idx" ON "behavioral_state"("conversationHash");
