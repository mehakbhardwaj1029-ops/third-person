import  prisma  from "../utils/prisma";
import { generateHash } from "../utils/hash.utils";
import { chunkDocument } from "./chunkApi.service";

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

    log.info({ userId, filename }, "Upload service started");

    const { chunks, participants} = await chunkDocument(fileBuffer, filename, { log });

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
        fileHash: "",
        rawText: "",
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

return chat;
}