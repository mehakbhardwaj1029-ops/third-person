import prisma from "../utils/prisma";
import { generateHash } from "../utils/hash.utils";
import { chunkDocument } from "./chunkApi.service";
import crypto from "crypto";

type Context = {
  log: any;
};

type UploadChatInput = {
  userId: string;
  fileBuffer: Buffer;
  filename: string;
  fileUrl?: string;
  sourceApp: string;
  tone?: string;
};

type Chunk = {
  order: number;
  content: string;
  wordCount: number;
  tokenCount: number;
};

export async function uploadChatService(
  data: UploadChatInput,
  ctx: Context
) {
  const { log } = ctx;

  const {
    userId,
    fileBuffer,
    filename,
    fileUrl,
    sourceApp,
    tone = "COACH",
  } = data;

  const text = fileBuffer.toString("utf-8");

  log.info({ userId, filename }, "Upload service started");

  const fileHash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

  // same user duplicate
  const existingUserChat = await prisma.chat.findFirst({
    where: {
      userId,
      fileHash,
    },
  });

  if (existingUserChat) {
    return {
      chat: existingUserChat,
      uploadType: "DUPLICATE_SAME_USER",
    };
  }

  // global duplicate upload
  const existingAnalysis = await prisma.chatAnalysis.findFirst({
    where: {
      fileHash,
      chat: {
        status: "ANALYZED",
      },
    },
    include: {
      chat: true,
    },
  });

  if (existingAnalysis) {
    return handleDuplicateFileUpload(
      data,
      fileHash,
      existingAnalysis.chatId
    );
  }

  const tokenLimit = 1000;

  const {
    chunks,
    participants,
    conversationHash,
    messageCount,
  } = await chunkDocument(text, tokenLimit);

  log.info(
    { chunkCount: chunks.length },
    "Chunking completed"
  );

  log.info(
    { participants },
    "Participants detected"
  );

  // find ancestor state
  const ancestorState = await findBestAncestorState(
    conversationHash,
    messageCount
  );

  // updated version upload
  if (ancestorState) {
    const ancestorFileHash = ancestorState.fileHash;

    const resumeFromChunk = await findResumePoint(
      ancestorFileHash,
      chunks
    );

    // create updated chat
    const chat = await prisma.chat.create({
      data: {
        userId,
        title: filename,
        sourceApp,
        tone,
        fileUrl,

        status: "CHUNKED",

        messageCount,
        participants,

        fileHash,
        conversationHash,

        ancestorFileHash,
        resumeFromChunk,

        rawText: text,
      },
    });

    log.info(
      {
        chatId: chat.id,
        resumeFromChunk,
      },
      "Updated chat created"
    );

    // only new chunks
    const newChunks = chunks.slice(resumeFromChunk);

    if (newChunks.length > 0) {
      await prisma.chunk.createMany({
        data: newChunks.map((chunk: Chunk) => ({
          fileHash,
          conversationHash,

          order: chunk.order,
          content: chunk.content,

          tokenCount: chunk.tokenCount,

          chunkHash: generateHash(chunk.content),

          status: "CHUNKED",
        })),
      });

      log.info(
        {
          chatId: chat.id,
          storedChunkCount: newChunks.length,
        },
        "Only new chunks stored"
      );
    }

    return {
      chat,
      uploadType: "UPDATED_CHAT_UPLOADED",
    };
  }

  // completely new upload
  const chat = await prisma.chat.create({
    data: {
      userId,
      title: filename,
      sourceApp,
      tone,
      fileUrl,

      status: "CHUNKED",

      messageCount,
      participants,

      fileHash,
      conversationHash,

      rawText: text,
    },
  });

  log.info(
    { chatId: chat.id },
    "Chat created"
  );

  // store all chunks
  await prisma.chunk.createMany({
    data: chunks.map((chunk: Chunk) => ({
      fileHash,
      conversationHash,

      order: chunk.order,
      content: chunk.content,

      tokenCount: chunk.tokenCount,

      chunkHash: generateHash(chunk.content),

      status: "CHUNKED",
    })),
  });

  log.info(
    {
      chatId: chat.id,
      count: chunks.length,
    },
    "Chunks stored"
  );

  return {
    chat,
    uploadType: "NEW_UPLOAD",
  };
}

async function handleDuplicateFileUpload(
  data: UploadChatInput,
  fileHash: string,
  originalChatId: string
) {
  const {
    userId,
    filename,
    fileUrl,
    sourceApp,
    tone = "COACH",
    fileBuffer,
  } = data;

  const text = fileBuffer.toString("utf-8");

  const existingChat = await prisma.chat.findUnique({
    where: {
      id: originalChatId,
    },
  });

  const newChat = await prisma.chat.create({
    data: {
      userId,

      title: filename,

      sourceApp,
      tone,
      fileUrl,

      status: "ANALYZED",

      messageCount:
        existingChat?.messageCount || 0,

      participants:
        existingChat?.participants || [],

      fileHash,

      conversationHash:
        existingChat?.conversationHash || "",

      rawText: text,
    },
  });

  return {
    chat: newChat,
    uploadType: "DUPLICATE_OTHER_USER",
  };
}

async function findBestAncestorState(
  conversationHash: string,
  currentMessageCount: number
) {
  return prisma.chatProcessingState.findFirst({
    where: {
      conversationHash,

      messageCount: {
        lte: currentMessageCount,
      },

      status: "ANALYZED",
    },

    orderBy: [
      {
        messageCount: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

async function findResumePoint(
  previousFileHash: string,
  incomingChunks: Chunk[]
) {
  const previousChunks = await prisma.chunk.findMany({
    where: {
      fileHash: previousFileHash,
    },

    orderBy: {
      order: "asc",
    },
  });

  const previousChunkMap = new Map(
    previousChunks.map((chunk) => [
      chunk.order,
      chunk,
    ])
  );

  let resumeIndex = 0;

  for (let i = 0; i < incomingChunks.length; i++) {
    const incomingChunk = incomingChunks[i];

    const existingChunk =
      previousChunkMap.get(incomingChunk.order);

    if (!existingChunk) {
      break;
    }

    const incomingChunkHash = generateHash(
      incomingChunk.content
    );

    if (
      existingChunk.chunkHash !== incomingChunkHash
    ) {
      break;
    }

    resumeIndex = i + 1;
  }

  return resumeIndex;
}