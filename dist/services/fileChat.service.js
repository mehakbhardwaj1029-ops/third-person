"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChatService = uploadChatService;
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const hash_utils_1 = require("../utils/hash.utils");
const chunkApi_service_1 = require("./chunkApi.service");
const UPLOAD_ROOT = path_1.default.join(process.cwd(), "uploads");
function getUploadPaths(uploadId, fileHash) {
    const uploadDir = path_1.default.join(UPLOAD_ROOT, uploadId);
    const chunksDir = path_1.default.join(uploadDir, "chunks");
    const aggregateDir = path_1.default.join(uploadDir, "aggregate");
    return {
        uploadDir,
        chunksDir,
        aggregateDir,
        fullTextPath: path_1.default.join(uploadDir, fileHash),
        relativeFullTextPath: path_1.default.join("uploads", uploadId, fileHash),
    };
}
function getChunkFilename(chunk) {
    const chunkHash = (0, hash_utils_1.generateHash)(chunk.content);
    const order = String(chunk.order).padStart(5, "0");
    return `chunk-${order}-${chunkHash}.txt`;
}
async function saveUploadFiles(params) {
    const { uploadId, fileHash, fileBuffer, chunks } = params;
    const paths = getUploadPaths(uploadId, fileHash);
    const aggregateText = buildAggregateText(chunks);
    const aggregateHash = (0, hash_utils_1.generateHash)(aggregateText);
    const aggregateTextPath = path_1.default.join(paths.aggregateDir, aggregateHash);
    const relativeAggregateTextPath = path_1.default.join("uploads", uploadId, "aggregate", aggregateHash);
    await (0, promises_1.mkdir)(paths.chunksDir, { recursive: true });
    await (0, promises_1.mkdir)(paths.aggregateDir, { recursive: true });
    await (0, promises_1.writeFile)(paths.fullTextPath, fileBuffer);
    await (0, promises_1.writeFile)(aggregateTextPath, aggregateText);
    await Promise.all(chunks.map((chunk) => (0, promises_1.writeFile)(path_1.default.join(paths.chunksDir, getChunkFilename(chunk)), chunk.content)));
    return {
        ...paths,
        aggregateText,
        aggregateHash,
        aggregateTextPath,
        relativeAggregateTextPath,
    };
}
function buildAggregateText(chunks) {
    return [...chunks]
        .sort((a, b) => a.order - b.order)
        .map((chunk) => chunk.content)
        .join("\n\n")
        .trim();
}
async function uploadChatService(data) {
    const { userId, fileBuffer, filename, fileUrl, sourceApp, tone = "COACH" } = data;
    const uploadId = (0, crypto_1.randomUUID)();
    const rawText = fileBuffer.toString("utf-8");
    const fileHash = (0, hash_utils_1.generateHash)(fileBuffer);
    //call chunk service
    const chunkData = await (0, chunkApi_service_1.chunkDocument)(fileBuffer, filename);
    const chunks = chunkData.chunks;
    console.log(chunkData); //verify doc-chunker service
    const uploadPaths = await saveUploadFiles({
        uploadId,
        fileHash,
        fileBuffer,
        chunks,
    });
    //create chat
    const chat = await prisma_1.default.chat.create({
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
    console.log(chunks.map((chunk) => ({
        content: chunk.content,
        hash: (0, hash_utils_1.generateHash)(chunk.content)
    })));
    //create chunk entities
    await prisma_1.default.chunk.createMany({
        data: chunks.map((chunk) => ({
            chatId: chat.id,
            order: chunk.order,
            content: chunk.content,
            tokenCount: chunk.wordCount,
            chunkHash: (0, hash_utils_1.generateHash)(chunk.content),
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
