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


export async function uploadChatService(data: UploadChatInput){
    const { userId, fileBuffer,filename, fileUrl, sourceApp, tone = "COACH" } = data;

    //call chunk service
    const chunkData = await chunkDocument(fileBuffer,filename);
    console.log(chunkData);  //verify doc-chunker service

    //create chat
    const chat = await prisma.chat.create({
    data: {
        userId,
        title: filename,
        sourceApp,
        tone,
        fileUrl,
        status: "CHUNKED",

        // temporary placeholders
        messageCount: 0,
        participants: [],
        fileHash: "",    // will add in future
        rawText: "",
    }
    });
    
 console.log(
  chunkData.map((chunk: Chunk) => ({
    content: chunk.content,
    hash: generateHash(chunk.content)
  }))
);

    //create chunk entities
 // create chunk entities
await prisma.chunk.createMany({
   data: chunkData.map((chunk: Chunk) => ({
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
 
