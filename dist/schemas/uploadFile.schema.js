"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResponseSchema = exports.createChatSchema = exports.parsedChatSchema = exports.messageSchema = exports.uploadChatSchema = void 0;
const zod_1 = require("zod");
exports.uploadChatSchema = zod_1.z.object({
    sourceApp: zod_1.z.enum(["WHATSAPP", "INSTAGRAM", "TELEGRAM", "OTHER"]),
    tone: zod_1.z.enum(["COACH", "BESTIE"]).optional()
});
exports.messageSchema = zod_1.z.object({
    sender: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    timestamp: zod_1.z.string()
});
exports.parsedChatSchema = zod_1.z.object({
    messages: zod_1.z.array(exports.messageSchema).min(1).max(10000),
    participants: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    messageCount: zod_1.z.number().int().nonnegative(),
    sourceApp: zod_1.z.string().toUpperCase()
});
exports.createChatSchema = zod_1.z.object({
    title: zod_1.z.string().default("UNTITLED CHAT"),
    rawText: zod_1.z.string().min(1).max(1_000_000),
    parsedJson: zod_1.z.any().optional(),
    fileUrl: zod_1.z.string().optional(),
    tone: zod_1.z.enum(["COACH", "BESTIE", "THERAPIST"]).default("COACH"),
    status: zod_1.z.enum(["UPLOADED", "PARSED", "ANALYZED"]).default("UPLOADED"),
    sourceApp: zod_1.z.string(),
    messageCount: zod_1.z.number().int().nonnegative(),
    participants: zod_1.z.array(zod_1.z.string()).min(1),
    userParticipant: zod_1.z.string().optional(),
});
exports.uploadResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    messageCount: zod_1.z.number().int().nonnegative(),
    participants: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.string().toUpperCase(),
});
