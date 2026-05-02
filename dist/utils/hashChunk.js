"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashChunk = hashChunk;
const crypto_1 = __importDefault(require("crypto"));
// function normalizeMessages(messages: ParsedMessage[]) {  // zod validation
//   return messages.map(m => ({
//     sender: m.sender.trim(),
//     message: m.message.trim(),
//     timestamp: m.timestamp.trim(),
//   }));
// }
function hashChunk(messages) {
    return crypto_1.default
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
