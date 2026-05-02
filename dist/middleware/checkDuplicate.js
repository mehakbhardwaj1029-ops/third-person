"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicate = checkDuplicate;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Deduplication logic has been moved to analysis.service.ts
 */
async function checkDuplicate(request, reply) {
    const fileHash = request.fileHash;
    if (!fileHash) {
        return; // Continue to next handler
    }
    // Note: fileHash is no longer unique, so use findFirst
    const existing = await prisma_1.default.chat.findFirst({
        where: {
            fileHash,
            status: "ANALYZED"
        },
        include: {
            analysis: true
        }
    });
    if (existing?.analysis) {
        return reply.send({
            source: "cache",
            analysisId: existing.analysis.id,
            message: "Using cached analysis from previous upload"
        });
    }
}
