/*
  Warnings:

  - You are about to drop the `ChatChunk` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `chatId` to the `Chunk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Chunk` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatChunk" DROP CONSTRAINT "ChatChunk_chatId_fkey";

-- DropForeignKey
ALTER TABLE "ChatChunk" DROP CONSTRAINT "ChatChunk_chunkId_fkey";

-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "embeddingId" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'READY',
ADD COLUMN     "tokenCount" INTEGER,
ALTER COLUMN "content" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "ChatChunk";

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "file_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
