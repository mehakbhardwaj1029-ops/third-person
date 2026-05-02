import prisma from "../utils/prisma";
import { parseChunkContent } from "../utils/chatParser";
import { callLLM } from "./llm.mock";

export async function analyzeChatService(
  chatId: string,
  userId: string
) {

  // VERIFY CHAT OWNERSHIP
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  });

  if (!chat) {
    throw new Error("Chat not found or unauthorized");
  }

 
  // 2. PREVENT DUPLICATE ANALYSIS
 
  if (chat.status === "PROCESSING") {

    return {
      status: "PROCESSING",
      message: "Analysis already running",
    };
  }

  if (chat.status === "ANALYZED") {

    return {
      status: "ANALYZED",
      message: "Chat already analyzed",
    };
  }

 
  // MARK CHAT AS PROCESSING
  
  await prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      status: "PROCESSING",
    },
  });

  
  // FETCH CHUNKS IN ORDER
  
  const chunks = await prisma.chunk.findMany({
    where: {
      chatId,
    },
    orderBy: {
      order: "asc",
    },
  });

  if (!chunks.length) {
    throw new Error("No chunks found");
  }

 
  //  RESTORE PREVIOUS STATE
 

  let rollingSummary = "";
  let lastProcessedChunk = 0;

  // Find latest summarized chunk
  const latestProcessedChunk =
    await prisma.chunk.findFirst({
      where: {
        chatId,
        summary: {
          not: null,
        },
      },
      orderBy: {
        order: "desc",
      },
    });

  // Restore state from latest chunk
  if (latestProcessedChunk) {

    rollingSummary =
      latestProcessedChunk.summary || "";

    lastProcessedChunk =
      latestProcessedChunk.order;
  }


  //  PROCESS CHUNKS SEQUENTIALLY
   
  for (const chunk of chunks) {

    // Skip already processed chunks
    if (chunk.order <= lastProcessedChunk) {
      continue;
    }


      // PARSE CURRENT CHUNK
  
    const parsedMessages =
      parseChunkContent(chunk.content);
      
      console.log(parsedMessages);

   
      // FORMAT PARSED MESSAGES FOR LLM INPUT
    
    const formattedText =
      parsedMessages
        .map((msg) => {
          return `[${msg.timestamp}] ${msg.sender}: ${msg.message}`;
        })
        .join("\n");

    
      // BUILD FINAL INPUT
    
    const llmInput = `
PREVIOUS SUMMARY:
${rollingSummary}

CURRENT CHAT CHUNK:
${formattedText}
`;


      // CALL LLM
 
    const llmResponse = await callLLM({
      text: llmInput,

      participants: chat.participants,

      userParticipant: chat.userParticipant,

      tone: chat.tone,
    });

   
    //  UPDATED SUMMARY
    
    const updatedSummary =
      llmResponse.summary;

   
      // STORE SUMMARY INSIDE CURRENT CHUNK
   
    await prisma.chunk.update({
      where: {
        id: chunk.id,
      },
      data: {
        summary: updatedSummary,
        status: "SUMMARIZED",
      },
    });

   
    //  UPDATE ROLLING SUMMARY
     
    rollingSummary = updatedSummary;

  
    //  UPDATE PROCESSING STATE
  
    await prisma.chatProcessingState.upsert({
      where: {
        chatId,
      },

      update: {
        lastChunkIndex: chunk.order,
        rollingSummary,
      },

      create: {
        chatId,
        lastChunkIndex: chunk.order,
        rollingSummary,
      },
    });
  }

  
  //  CREATE FINAL ANALYSIS

  const finalAnalysis =
    await prisma.chatAnalysis.create({
      data: {
        chatId,

        summary: rollingSummary,

        compatibilityScore: 0,

        userInsights: {},

        overallInsights: {},

        tone: chat.tone,
      },
    });

 
    // MARK CHAT AS ANALYZED
  
  await prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      status: "ANALYZED",
    },
  });

  
  // RETURN FINAL ANALYSIS
  
  return finalAnalysis;
}