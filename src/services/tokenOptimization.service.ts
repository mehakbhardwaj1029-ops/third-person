
// remove obvious filler
// compress low-value messages
// normalize text
// src/ai/optimizeChunkForLLM.ts

type ParsedMessage = {
  timestamp: string;
  sender: string;
  message: string;
};

const IGNORED_MESSAGES = new Set([
  "hi",
  "hii",
  "hello",
  "hey",
  "ok",
  "okay",
  "okk",
  "k",
  "kk",
  "hmm",
  "hmmm",
  "hmmmmm",
  "lol",
  "haha",
  "hehe",
  "thanks",
  "thank you",
  "ty",
  "gn",
  "gm",
  "good night",
  "good morning",
  "bro",
  "👍",
  "😂",
  "🤣",
  "❤️",
]);

function normalizeMessage(message: string) {
  return message
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function isLowValueMessage(message: string) {
  const normalized = normalizeMessage(message);

  // exact ignored match
  if (IGNORED_MESSAGES.has(normalized)) {
    return true;
  }

  // emoji-only messages
  const emojiOnlyRegex =
    /^[\p{Emoji}\p{Extended_Pictographic}\s]+$/u;

  if (emojiOnlyRegex.test(normalized)) {
    return true;
  }

  // repeated characters like "hmmmmmmmm"
  if (/(.)\1{3,}/.test(normalized)) {
    return true;
  }

  // very short meaningless replies
  if (
    normalized.length <= 2 &&
    !["no", "yo"].includes(normalized)
  ) {
    return true;
  }

  return false;
}

export function optimizeChunkForLLM(
  messages: ParsedMessage[]
) {
  const optimizedMessages: string[] = [];

  let omittedCount = 0;

  for (const msg of messages) {
    const cleanedMessage = msg.message.trim();

    if (isLowValueMessage(cleanedMessage)) {
      omittedCount++;
      continue;
    }

  

    optimizedMessages.push(
      `[${msg.timestamp}] ${msg.sender}: ${cleanedMessage}`
    );
  }


  return optimizedMessages.join("\n");
}


// test to check optimization
function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function analyzeOptimization(
  original: string,
  optimized: string
) {
  const originalChars = original.length;

  const optimizedChars = optimized.length;

  const originalTokens =
    estimateTokens(original);

  const optimizedTokens =
    estimateTokens(optimized);

  return {
    originalChars,
    optimizedChars,

    removedChars:
      originalChars - optimizedChars,

    originalTokens,
    optimizedTokens,

    removedTokens:
      originalTokens - optimizedTokens,

    reductionPercentage:
      originalChars === 0
        ? 0
        : Number(
            (
              ((originalChars -
                optimizedChars) /
                originalChars) *
              100
            ).toFixed(2)
          ),
  };
} 