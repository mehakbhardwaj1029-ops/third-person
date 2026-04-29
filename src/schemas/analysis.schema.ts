import { z } from "zod";

const participantSchema = z.object({
  name: z.string(),

  traits: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
  }),

  emotions: z.object({
    dominant: z.array(z.string()),
    secondary: z.array(z.string()),
  }),

  mbti: z.object({
    type: z.string(),
    confidence: z.number().min(0).max(1),
    explanation: z.string(),
  }),

  behaviourPatterns: z.array(z.string()),
});

export const chatAnalysisSchema = z.object({
  summary: z.string(),

  compatibilityScore: z.number().min(0).max(100),

  userInsights: z.object({
    warnings: z.array(z.string()),
    suggestions: z.array(z.string()),
    behavioralAdvice: z.array(z.string()),
  }),

  overallInsights: z.object({
    relationshipType: z.string(),
    communicationStyle: z.string(),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    keyObservations: z.array(z.string()),
  }),

  participants: z.array(participantSchema),
});

export type ChatAnalysis = z.infer<typeof chatAnalysisSchema>;
export type ParticipantAnalysis = z.infer<typeof participantSchema>;