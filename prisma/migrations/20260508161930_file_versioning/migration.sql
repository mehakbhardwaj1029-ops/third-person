/*
  Warnings:

  - You are about to drop the `ChatProcessingState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Chunk` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conversationHash` to the `file_chats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chunk" DROP CONSTRAINT "Chunk_chatId_fkey";

-- AlterTable
ALTER TABLE "file_chats" ADD COLUMN     "ancestorFileHash" TEXT,
ADD COLUMN     "conversationHash" TEXT NOT NULL,
ADD COLUMN     "resumeFromChunk" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "ChatProcessingState";

-- DropTable
DROP TABLE "Chunk";

-- CreateTable
CREATE TABLE "chunk" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "conversationHash" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "summary" JSONB,
    "embeddingId" TEXT,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_processing_state" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "conversationHash" TEXT NOT NULL,
    "lastChunkIndex" INTEGER NOT NULL,
    "rollingSummary" JSONB,
    "messageCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_processing_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chunk_conversationHash_idx" ON "chunk"("conversationHash");

-- CreateIndex
CREATE INDEX "chunk_chunkHash_idx" ON "chunk"("chunkHash");

-- CreateIndex
CREATE UNIQUE INDEX "chunk_fileHash_order_key" ON "chunk"("fileHash", "order");

-- CreateIndex
CREATE UNIQUE INDEX "chat_processing_state_fileHash_key" ON "chat_processing_state"("fileHash");

-- CreateIndex
CREATE INDEX "chat_processing_state_conversationHash_idx" ON "chat_processing_state"("conversationHash");

-- CreateIndex
CREATE INDEX "file_chats_conversationHash_idx" ON "file_chats"("conversationHash");
