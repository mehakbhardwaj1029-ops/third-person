import OpenAI from "openai";
const MODELS = [
  // "google/gemma-4-26b-a4b-it:free",
  // "google/gemma-4-31b-it:free",
  // "nvidia/nemotron-3-super-120b-a12b:free",
  // "minimax/minimax-m2.5:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free"

];
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
});

type LLMInput = {
  text: string;
  participants: string[];
  userParticipant?: string | null;
  tone: string;
};

export async function callLLM(input: LLMInput) {
  const prompt = buildPrompt(input);

  for (const model of MODELS) {
    try {
      console.log(`🚀 Trying model: ${model}`);

      const completion = await withRetry(() => client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Return strict JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      }));

      const text = completion.choices[0]?.message?.content || "";

      const cleaned = text.replace(/```json|```/g, "").trim();

      return safeJsonParse(cleaned);

    } catch (err: any) {
      if (err.status === 429) {
        console.log(` ${model} rate-limited, switching model...`);
        continue;
      }

      throw err;
    }
  }

  throw new Error("All models failed due to rate limits");
}

function buildPrompt(input: LLMInput): string {
  return `
You are an expert relationship and behavioral analyst.

Analyze the following conversation deeply.

Participants: ${input.participants.join(", ")}
User is: ${input.userParticipant || "unknown"}

If user is identified:
- Focus insights specifically for this user
- Highlight risks they should be aware of
- Give actionable behavioral advice tailored to this user
Tone of response: ${input.tone}

- Return ONLY valid JSON
- NO markdown
- NO explanation
- NO backticks
- If unsure, still return valid JSON

Start response with '{' and end with '}'

Schema:
{
  "summary": string,
  "compatibilityScore": number (0-100),

  "userInsights": {
    "warnings": string[],
    "suggestions": string[],
    "behavioralAdvice": string[]
  },

  "overallInsights": {
    "relationshipType": string,
    "communicationStyle": string,
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "keyObservations": string[]
  },

  "participants": [
    {
      "name": string,
      "traits": {
        "positive": string[],
        "negative": string[]
      },
      "emotions": {
        "dominant": string[],
        "secondary": string[]
      },
      "mbti": {
        "type": string,
        "confidence": number (0-1),
        "explanation": string
      },
      "behaviourPatterns": string[]
    }
  ]
}

Chat:
${typeof input.text === "string" ? input.text : JSON.stringify(input.text)}
`;
}

async function withRetry(fn: () => Promise<any>, retries = 3) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.status === 429) {
        const delay = 1000 * (attempt + 1); // 1s → 2s → 3s
        console.log(`⚠️ Rate limited, retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }

const error = new Error("Rate limit after retries");
(error as any).status = 429;
throw error;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    // try to fix truncated JSON
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace !== -1) {
      const trimmed = text.slice(0, lastBrace + 1);
      return JSON.parse(trimmed);
    }
    throw new Error("Invalid JSON from LLM");
  }
}