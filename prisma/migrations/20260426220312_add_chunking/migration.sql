-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "chunkHash" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatChunk" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ChatChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatProcessingState" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "lastChunkIndex" INTEGER NOT NULL,
    "rollingSummary" TEXT NOT NULL,

    CONSTRAINT "ChatProcessingState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chunk_chunkHash_key" ON "Chunk"("chunkHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChatChunk_chatId_order_key" ON "ChatChunk"("chatId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ChatProcessingState_chatId_key" ON "ChatProcessingState"("chatId");

-- AddForeignKey
ALTER TABLE "ChatChunk" ADD CONSTRAINT "ChatChunk_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "file_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatChunk" ADD CONSTRAINT "ChatChunk_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
