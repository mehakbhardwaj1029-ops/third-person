import { z } from "zod";

export const uploadChatSchema = z.object({
    sourceApp: z.enum(["WHATSAPP", "INSTAGRAM", "TELEGRAM", "OTHER"]),
    tone: z.enum(["COACH", "BESTIE"]).optional()
})

export const messageSchema = z.object({
    sender: z.string().min(1),
    message: z.string().min(1),
    timestamp: z.string()
})

export const parsedChatSchema = z.object({

    messages: z.array(messageSchema).min(1).max(10000),
    participants: z.array(z.string().min(1)).min(1),
    messageCount: z.number().int().nonnegative(),
    sourceApp: z.string().toUpperCase()

})


export const createChatSchema = z.object({

    title: z.string().default("UNTITLED CHAT"),
    rawText: z.string().min(1).max(1_000_000),
    parsedJson: z.any().optional(),
    fileUrl: z.string().optional(),
    tone: z.enum(["COACH", "BESTIE", "THERAPIST"]).default("COACH"),
    status: z.enum(["UPLOADED", "PARSED", "ANALYZED"]).default("UPLOADED"),
    sourceApp: z.string(),
    messageCount: z.number().int().nonnegative(),
    participants: z.array(z.string()).min(1),
    userParticipant: z.string().optional(),
})

export const uploadResponseSchema = z.object({
    id: z.string(),
    messageCount : z.number().int().nonnegative(),
    participants: z.array(z.string()),
    status: z.string().toUpperCase(),
})


