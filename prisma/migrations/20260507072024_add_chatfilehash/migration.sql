/*
  Warnings:

  - The `rollingSummary` column on the `ChatProcessingState` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `Chunk` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[chatId,participantId]` on the table `participant_analyses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileHash` to the `chat_analyses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatProcessingState" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PROCESSING',
DROP COLUMN "rollingSummary",
ADD COLUMN     "rollingSummary" JSONB;

-- AlterTable
ALTER TABLE "Chunk" DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB;

-- AlterTable
ALTER TABLE "chat_analyses" ADD COLUMN     "fileHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "participant_analyses_chatId_participantId_key" ON "participant_analyses"("chatId", "participantId");
