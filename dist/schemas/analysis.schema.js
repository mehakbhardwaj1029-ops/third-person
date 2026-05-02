"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAnalysisSchema = void 0;
const zod_1 = require("zod");
const participantSchema = zod_1.z.object({
    name: zod_1.z.string(),
    traits: zod_1.z.object({
        positive: zod_1.z.array(zod_1.z.string()),
        negative: zod_1.z.array(zod_1.z.string()),
    }),
    emotions: zod_1.z.object({
        dominant: zod_1.z.array(zod_1.z.string()),
        secondary: zod_1.z.array(zod_1.z.string()),
    }),
    mbti: zod_1.z.object({
        type: zod_1.z.string(),
        confidence: zod_1.z.number().min(0).max(1),
        explanation: zod_1.z.string(),
    }),
    behaviourPatterns: zod_1.z.array(zod_1.z.string()),
});
exports.chatAnalysisSchema = zod_1.z.object({
    summary: zod_1.z.string(),
    compatibilityScore: zod_1.z.number().min(0).max(100),
    userInsights: zod_1.z.object({
        warnings: zod_1.z.array(zod_1.z.string()),
        suggestions: zod_1.z.array(zod_1.z.string()),
        behavioralAdvice: zod_1.z.array(zod_1.z.string()),
    }),
    overallInsights: zod_1.z.object({
        relationshipType: zod_1.z.string(),
        communicationStyle: zod_1.z.string(),
        riskLevel: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
        keyObservations: zod_1.z.array(zod_1.z.string()),
    }),
    participants: zod_1.z.array(participantSchema),
});
