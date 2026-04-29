/*
  Warnings:

  - Added the required column `fileHash` to the `file_chats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file_chats" ADD COLUMN     "fileHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "file_chats_fileHash_idx" ON "file_chats"("fileHash");
