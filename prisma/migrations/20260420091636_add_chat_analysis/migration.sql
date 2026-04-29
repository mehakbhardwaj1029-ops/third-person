-- CreateTable
CREATE TABLE "chat_analyses" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "summary" TEXT,
    "compatibilityScore" INTEGER NOT NULL,
    "userInsights" JSONB NOT NULL,
    "overallInsights" JSONB NOT NULL,
    "tone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_analyses" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "traits" JSONB NOT NULL,
    "emotions" JSONB NOT NULL,
    "mbtiType" TEXT NOT NULL,
    "mbtiMeta" JSONB NOT NULL,
    "behaviourPatterns" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_analyses_chatId_key" ON "chat_analyses"("chatId");

-- CreateIndex
CREATE INDEX "chat_analyses_chatId_idx" ON "chat_analyses"("chatId");

-- CreateIndex
CREATE INDEX "participants_userId_idx" ON "participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_userId_name_key" ON "participants"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_chatId_participantId_key" ON "chat_participants"("chatId", "participantId");

-- CreateIndex
CREATE INDEX "participant_analyses_chatId_idx" ON "participant_analyses"("chatId");

-- CreateIndex
CREATE INDEX "file_chats_userId_idx" ON "file_chats"("userId");

-- AddForeignKey
ALTER TABLE "chat_analyses" ADD CONSTRAINT "chat_analyses_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "file_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "file_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_analyses" ADD CONSTRAINT "participant_analyses_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "file_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_analyses" ADD CONSTRAINT "participant_analyses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
