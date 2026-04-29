-- CreateTable
CREATE TABLE "file_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Chat',
    "rawText" TEXT NOT NULL,
    "fileUrl" TEXT,
    "parsedJson" JSONB,
    "tone" TEXT NOT NULL DEFAULT 'COACH',
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "sourceApp" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "participants" TEXT[],
    "userParticipant" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_chats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_chats" ADD CONSTRAINT "file_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
