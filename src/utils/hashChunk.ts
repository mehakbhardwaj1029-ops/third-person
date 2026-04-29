import crypto from "crypto";
type ParsedMessage = {
  sender: string;
  message: string;
  timestamp: string;
};

// function normalizeMessages(messages: ParsedMessage[]) {  // zod validation
//   return messages.map(m => ({
//     sender: m.sender.trim(),
//     message: m.message.trim(),
//     timestamp: m.timestamp.trim(),
//   }));
// }

export function hashChunk(messages: ParsedMessage[]): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(messages))
    .digest("hex");
}

// export function buildChunksWithHash(messages: ParsedMessage[]) {
//   const chunks = chunkParsedMessages(messages);

//   return chunks.map(chunk => ({
//     ...chunk,
//     hash: hashChunk(chunk.messages),
//   }));
// }