import crypto from "crypto";

export interface Chunk {
  chunkId: string;
  order: number;
  wordCount: number;
  tokenCount: number;
  content: string;
}

export interface ChunkResult {
  chunks: Chunk[];
  participants: string[];
}

export async function chunkDocument(
  text: string,
  tokenLimit: number = 1000
): Promise<ChunkResult> {

  // Match each WhatsApp message block
  const messageStartRegex =
    /(\d{2}\/\d{2}\/\d{2},\s\d{1,2}:\d{2}\s(?:am|pm)\s-\s.*?)(?=\d{2}\/\d{2}\/\d{2},\s\d{1,2}:\d{2}\s(?:am|pm)\s-|$)/gis;

  const rawMessages =
    text.match(messageStartRegex)?.map(msg => msg.trim()) || [];

  const chunks: Chunk[] = [];

  // Use Set to avoid duplicates
  const participantSet = new Set<string>();

  let currentChunkMessages: string[] = [];
  let currentTokenCount = 0;
  let order = 1;

  for (const message of rawMessages) {

    // Extract participant from every message
    const sender = extractParticipant(message);

    if (sender) {
      participantSet.add(sender);
    }

    const estimatedTokens = estimateTokens(message);

    // Huge single message case
    if (estimatedTokens > tokenLimit) {

      if (currentChunkMessages.length > 0) {
        const chunkContent = currentChunkMessages.join("\n");

        chunks.push(
          createChunk(
            chunkContent,
            order++,
            currentTokenCount
          )
        );

        currentChunkMessages = [];
        currentTokenCount = 0;
      }

      chunks.push(
        createChunk(
          message,
          order++,
          estimatedTokens
        )
      );

      continue;
    }

    // If chunk exceeds limit
    if (currentTokenCount + estimatedTokens > tokenLimit) {

      const chunkContent = currentChunkMessages.join("\n");

      chunks.push(
        createChunk(
          chunkContent,
          order++,
          currentTokenCount
        )
      );

      currentChunkMessages = [];
      currentTokenCount = 0;
    }
    
    currentChunkMessages.push(message);
    currentTokenCount += estimatedTokens;
  }

  // Final chunk
  if (currentChunkMessages.length > 0) {
    const chunkContent = currentChunkMessages.join("\n");

    chunks.push(
      createChunk(
        chunkContent,
        order++,
        currentTokenCount
      )
    );
  }

  return {
    chunks,
    participants: Array.from(participantSet)
  };
}

function extractParticipant(message: string): string | null {

  // Example:
  // 22/01/26, 3:52 pm - Rahul: Hello

  const match = message.match(
    /^\d{2}\/\d{2}\/\d{2},\s\d{1,2}:\d{2}\s(?:am|pm)\s-\s([^:]+):/i
  );

  if (!match) return null;

  return match[1].trim();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function createChunk(
  content: string,
  order: number,
  tokenCount: number
): Chunk {

  return {
    chunkId: crypto.randomUUID(),
    order,
    wordCount: content.split(/\s+/).length,
    tokenCount,
    content
  };
}