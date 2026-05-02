"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChunksWithHash = buildChunksWithHash;
const crypto_1 = __importDefault(require("crypto"));
function buildChunksWithHash(messages) {
    const chunkSize = 50; // number of messages per chunk
    const overlap = 10;
    const chunks = [];
    for (let i = 0; i < messages.length; i += chunkSize - overlap) {
        const slice = messages.slice(i, i + chunkSize);
        const hash = crypto_1.default
            .createHash("sha256")
            .update(JSON.stringify(slice))
            .digest("hex");
        chunks.push({
            messages: slice,
            hash,
        });
    }
    return chunks;
}
