type LLMInput = {
  text: string;
  participants: string[];
  userParticipant?: string | null;
  tone: string;

  previousState?: any; 
};



export async function callLLM(input: LLMInput) {
  console.log(" participants in llm call ", input.participants);

  // simulate delay 
  await new Promise((res) => setTimeout(res, 500));

  return {
    summary: "This is a mock summary of the conversation showing general interaction patterns between participants.",

    compatibilityScore: 72,

    userInsights: {
      warnings: [
        "User may be over-investing emotionally",
        "Potential imbalance in communication effort"
      ],
      suggestions: [
        "Try maintaining clearer boundaries",
        "Encourage balanced participation"
      ],
      behavioralAdvice: [
        "Avoid overthinking delayed responses",
        "Focus on clarity in communication"
      ]
    },

    overallInsights: {
      relationshipType: "Casual / Developing",
      communicationStyle: "Mixed (sometimes engaging, sometimes distant)",
      riskLevel: "MEDIUM",
      keyObservations: [
        "One participant initiates more often",
        "Responses are sometimes delayed",
        "Emotional tone fluctuates"
      ]
    },

    participants: input.participants.map((name) => ({
      name,
      traits: {
        positive: ["Friendly", "Engaging"],
        negative: ["Inconsistent", "Reserved"]
      },
      emotions: {
        dominant: ["Curious", "Neutral"],
        secondary: ["Anxious"]
      },
      mbti: {
        type: "INFP",
        confidence: 0.65,
        explanation: "Shows introspection and emotional sensitivity"
      },
      behaviourPatterns: [
        "Occasional delayed replies",
        "Emotional expression varies",
        "Responds more than initiates"
      ]
    }))
  };
}