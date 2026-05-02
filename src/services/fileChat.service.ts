import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import  prisma  from "../utils/prisma";
import { generateHash } from "../utils/hash.utils";
import { chunkDocument } from "./chunkApi.service";
 

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

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function getUploadPaths(uploadId: string, fileHash: string) {
   const uploadDir = path.join(UPLOAD_ROOT, uploadId);
   const chunksDir = path.join(uploadDir, "chunks");
   const aggregateDir = path.join(uploadDir, "aggregate");

   return {
      uploadDir,
      chunksDir,
      aggregateDir,
      fullTextPath: path.join(uploadDir, fileHash),
      relativeFullTextPath: path.join("uploads", uploadId, fileHash),
   };
}

function getChunkFilename(chunk: Chunk) {
   const chunkHash = generateHash(chunk.content);
   const order = String(chunk.order).padStart(5, "0");

   return `chunk-${order}-${chunkHash}.txt`;
}

async function saveUploadFiles(params: {
   uploadId: string;
   fileHash: string;
   fileBuffer: Buffer;
   chunks: Chunk[];
}) {
   const { uploadId, fileHash, fileBuffer, chunks } = params;
   const paths = getUploadPaths(uploadId, fileHash);
   const aggregateText = buildAggregateText(chunks);
   const aggregateHash = generateHash(aggregateText);
   const aggregateTextPath = path.join(paths.aggregateDir, aggregateHash);
   const relativeAggregateTextPath = path.join(
      "uploads",
      uploadId,
      "aggregate",
      aggregateHash
   );

   await mkdir(paths.chunksDir, { recursive: true });
   await mkdir(paths.aggregateDir, { recursive: true });
   await writeFile(paths.fullTextPath, fileBuffer);
   await writeFile(aggregateTextPath, aggregateText);

   await Promise.all(
      chunks.map((chunk) =>
         writeFile(
            path.join(paths.chunksDir, getChunkFilename(chunk)),
            chunk.content
         )
      )
   );

   return {
      ...paths,
      aggregateText,
      aggregateHash,
      aggregateTextPath,
      relativeAggregateTextPath,
   };
}

function buildAggregateText(chunks: Chunk[]) {
   return [...chunks]
      .sort((a, b) => a.order - b.order)
      .map((chunk) => chunk.content)
      .join("\n\n")
      .trim();
}


export async function uploadChatService(data: UploadChatInput){
    const { userId, fileBuffer,filename, fileUrl, sourceApp, tone = "COACH" } = data;

    const uploadId = randomUUID();
    const rawText = fileBuffer.toString("utf-8");
    const fileHash = generateHash(fileBuffer);

    //call chunk service
    const chunkData = await chunkDocument(fileBuffer,filename);
    const chunks = chunkData.chunks as Chunk[];
    console.log(chunkData);  //verify doc-chunker service

    const uploadPaths = await saveUploadFiles({
      uploadId,
      fileHash,
      fileBuffer,
      chunks,
    });

    //create chat
    const chat = await prisma.chat.create({
    data: {
        id: uploadId,
        userId,
        title: filename,
        sourceApp,
        tone,
        fileUrl: fileUrl || uploadPaths.relativeFullTextPath,
        status: "CHUNKED",

        messageCount: 0,
        participants: [],
        fileHash: uploadPaths.aggregateHash,
        rawText: uploadPaths.aggregateText || rawText,
    }
    });
    
    console.log(
  chunks.map((chunk:Chunk) => ({
     content: chunk.content,
     hash: generateHash(chunk.content)
  }))
);

    //create chunk entities
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
return chat;
}
 

// export async function uploadChatService(data: UploadChatInput){
//     const { userId, fileBuffer, fileUrl, sourceApp, tone = "COACH" } = data;

//     // Parse file
//     const parsed = parseChatFile(fileBuffer);

//     // Generate fileHash from raw text (deterministic)
//     const fileHash = generateHash(parsed.rawText);

//     // Save to database
//     const chat = await prisma.chat.create({
//         data: {
//             userId,
//             fileHash,
//             rawText: parsed.rawText,
//             parsedJson: parsed.parsedMessages,
//             participants: parsed.participants,
//             messageCount: parsed.messageCount,
//             fileUrl: fileUrl || null,
//             sourceApp,
//             tone: tone || "COACH",
//             status: "UPLOADED",
//         }
//     });
    
//     return chat;
// }
 
