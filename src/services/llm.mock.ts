type ChunkLLMInput = {
  text: string;

  participants: string[];

  userParticipant?: string | null;

  tone: string;

};

type FinalLLMInput = {
  behavioralState: any;

  participants: string[];

  userParticipant?: string | null;

  tone: string;
};

// ======================================================
// CHUNK ANALYSIS LLM
// ======================================================

export async function callChunkAnalysisLLM(
  input: ChunkLLMInput
) {
  console.log(
    "Chunk analysis participants:",
    input.participants
  );

  // simulate delay
  await new Promise((res) =>
    setTimeout(res, 500)
  );

  return {
    summary:
      "Conversation shows emotional reassurance and uneven conversational effort.",

    signals: {
      emotions: [
        "support",
        "trust"
      ],

      relationshipSignals: [
        "emotional closeness"
      ],

      communicationPatterns: [
        "delayed responses",
        "one-sided initiation"
      ]
    },

    participants: [
      {
        name: "Mehak",

        detectedTraits: [
          "emotionally expressive",
          "supportive"
        ],

        emotionalIndicators: [
          "concerned",
          "emotionally invested"
        ],

        behaviorPatterns: [
          "initiates conversations",
          "seeks reassurance"
        ],

        mbtiEvidence: [
          "INFJ",
          "INFJ",
          "INFP"
        ]
      }
    ],

    importantEvents: [
      "emotional reassurance attempt",
      "delayed emotional response"
    ]
  };
}

// ======================================================
// FINAL ANALYSIS LLM
// ======================================================

export async function callFinalAnalysisLLM(
  input: FinalLLMInput
) {
  console.log(
    "Final synthesis participants:",
    input.participants
  );

  // simulate delay
  await new Promise((res) =>
    setTimeout(res, 1000)
  );

  return {
    summary:
      "The conversation reflects a relationship with emotional dependence, uneven communication effort, and recurring reassurance-seeking patterns.",

    compatibilityScore: 72,

    userInsights: {
      warnings: [
        "Emotional dependency patterns are increasing.",
        "Communication imbalance may create future frustration."
      ],

      suggestions: [
        "Encourage healthier emotional boundaries.",
        "Promote balanced conversational effort."
      ],

      behavioralAdvice: [
        "Avoid excessive reassurance-seeking.",
        "Communicate emotional needs more directly."
      ]
    },

    overallInsights: {
      relationshipType:
        "Emotionally Attached",

      communicationStyle:
        "Supportive but imbalanced",

      riskLevel: "Moderate",

      keyObservations: [
        "One participant initiates most conversations.",
        "Emotional reassurance is frequently sought.",
        "Trust and emotional closeness are increasing."
      ]
    },

    participants: [
      {
        name: "Mehak",

        traits: {
          positive: [
            "empathetic",
            "emotionally expressive"
          ],

          negative: [
            "overthinks emotional signals"
          ]
        },

        emotions: {
          dominant: [
            "concern",
            "attachment"
          ],

          secondary: [
            "anxiety"
          ]
        },

        mbti: {
          type: "INFJ",

          confidence: 0.82,

          explanation:
            "Frequent emotionally reflective and supportive communication patterns indicate INFJ-like tendencies."
        },

        behaviourPatterns: [
          "initiates emotional conversations",
          "seeks reassurance",
          "emotionally analyzes interactions"
        ]
      }
    ]
  };
}