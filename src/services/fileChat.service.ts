import  prisma  from "../utils/prisma";
import { generateHash } from "../utils/hash.utils";
import { chunkDocument } from "./chunkApi.service";
import crypto from "crypto";

type Context = {
  log: any;
};

type UploadChatInput = {
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    fileUrl?: string,
    sourceApp: string,
    tone?: string,
}

type Chunk = {
   order: number;
   content: string;
   wordCount: number;
};

export async function uploadChatService(data: UploadChatInput, ctx: Context){
    const { log } = ctx;
    const { userId, fileBuffer,filename, fileUrl, sourceApp, tone = "COACH" } = data;
    const text = fileBuffer.toString("utf-8");


    log.info({ userId, filename }, "Upload service started");

    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

      const existingUserChat = await prisma.chat.findFirst({
        where: {
            userId,
            fileHash,
        },
    });

    if (existingUserChat) {
       return{
        chat: existingUserChat,
        uploadType: "DUPLICATE_SAME_USER"
       }
    }


    const existingAnalysis = await prisma.chatAnalysis.findFirst({
        where: {
            fileHash,
            chat: {
                status: "ANALYZED",
            }
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

    const { chunks, participants} = await chunkDocument(text,tokenLimit);

    log.info({ chunkCount: chunks.length }, "Chunking completed");
    log.info({ participants }, "Participants detected");

    const chat = await prisma.chat.create({
    data: {
        userId,
        title: filename,
        sourceApp,
        tone,
        fileUrl,
        status: "CHUNKED",

        messageCount: 0,
        participants,
        fileHash,
        rawText: text,
    }
    });

    log.info({ chatId: chat.id }, "Chat created");


await prisma.chunk.createMany({
   data: chunks.map((chunk: Chunk) => ({
      chatId: chat.id,
      order: chunk.order,
      content: chunk.content,
      tokenCount: chunk.wordCount,
      chunkHash: generateHash(chunk.content),
      status: "CHUNKED",
   }))
});

    log.info({ chatId: chat.id, count: chunks.length }, "Chunks stored");

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

  // Create new chat entry
  const newChat = await prisma.chat.create({
    data: {
      userId,
      title: filename,
      sourceApp,
      tone,
      fileUrl,
      status: "ANALYZED",

      messageCount: existingChat?.messageCount || 0,
      participants: existingChat?.participants || [],
      fileHash,
      rawText: text,
    },
  });

  // Fetch ORIGINAL processing state
  const existingState = await prisma.chatProcessingState.findUnique({
    where: {
      chatId: originalChatId,
    },
  });

  // Copy processing state
  if (existingState) {
    await prisma.chatProcessingState.create({
      data: {
        chatId: newChat.id,
        lastChunkIndex: existingState.lastChunkIndex,
        rollingSummary: existingState.rollingSummary ?? {},
        status: "ANALYZED",
      },
    });
  }

  return {
   chat: newChat,
   uploadType: "DUPLICATE_OTHER_USER",
};
}