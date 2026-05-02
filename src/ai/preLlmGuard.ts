export type RiskLevel = "low" | "medium" | "high" | "blocked";

export type GuardResult = {
  safeForLlm: boolean;
  riskLevel: RiskLevel;
  originalText: string;
  cleanedText: string;
  compressedText: string;
  detectedInjection: boolean;
  detectedPatterns: string[];
  redactions: string[];
  originalCharCount: number;
  cleanedCharCount: number;
  compressedCharCount: number;
  warnings: string[];
};

type GuardOptions = {
  maxChars?: number;
  blockHighRisk?: boolean;
};

const DEFAULT_MAX_CHARS = 12000;

const PROMPT_INJECTION_PATTERNS: {
  label: string;
  regex: RegExp;
  severity: number;
}[] = [
  {
    label: "Ignore previous instructions",
    regex:
      /\b(ignore|disregard|forget)\b.{0,40}\b(previous|above|prior|system|developer)\b.{0,40}\b(instructions|prompt|rules|message)\b/i,
    severity: 3,
  },
  {
    label: "Reveal hidden/system prompt",
    regex:
      /\b(reveal|show|print|display|tell me)\b.{0,40}\b(system prompt|developer prompt|hidden prompt|hidden instructions|internal rules)\b/i,
    severity: 4,
  },
  {
    label: "Role override",
    regex: /\b(you are now|act as|pretend to be|roleplay as)\b/i,
    severity: 2,
  },
  {
    label: "Jailbreak attempt",
    regex:
      /\b(jailbreak|developer mode|admin mode|god mode|bypass safety|bypass rules|override safety)\b/i,
    severity: 4,
  },
  {
    label: "Instruction hierarchy attack",
    regex:
      /\b(system message|developer message|highest priority|new instructions|override instructions)\b/i,
    severity: 3,
  },
  {
    label: "Data exfiltration attempt",
    regex:
      /\b(api key|secret key|password|token|private data|confidential data|database dump|environment variable)\b/i,
    severity: 4,
  },
  {
    label: "Identity extraction",
    regex:
      /\b(tell me who i am|who is the user|reveal user identity|show user profile)\b/i,
    severity: 3,
  },
  {
    label: "Model manipulation",
    regex:
      /\b(do not follow|do not obey|ignore your rules|break character|no restrictions)\b/i,
    severity: 3,
  },
];

const PII_PATTERNS: { label: string; regex: RegExp; replacement: string }[] = [
  {
    label: "email",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    label: "phone",
    regex:
      /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/g,
    replacement: "[REDACTED_PHONE]",
  },
  {
    label: "url",
    regex: /https?:\/\/[^\s]+/gi,
    replacement: "[REDACTED_URL]",
  },
  {
    label: "upi",
    regex:
      /\b[\w.-]+@(upi|okaxis|okhdfcbank|oksbi|okicici|ybl|ibl|axl|paytm)\b/gi,
    replacement: "[REDACTED_UPI]",
  },
];

const EMOTIONALLY_IMPORTANT_KEYWORDS = [
  "love",
  "miss",
  "sorry",
  "trust",
  "hurt",
  "angry",
  "upset",
  "cry",
  "ignored",
  "busy",
  "cheat",
  "lied",
  "fight",
  "breakup",
  "relationship",
  "feel",
  "felt",
  "care",
  "call",
  "text",
  "blocked",
  "promise",
  "family",
  "marriage",
  "future",
  "commitment",
  "jealous",
  "insecure",
  "respect",
  "alone",
  "confused",
  "why",
  "what happened",
  "are you okay",
];

function normaliseText(input: string): string {
  return input
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function detectPromptInjection(input: string) {
  const detectedPatterns: string[] = [];
  let severityScore = 0;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.regex.test(input)) {
      detectedPatterns.push(pattern.label);
      severityScore += pattern.severity;
    }
  }

  let riskLevel: RiskLevel = "low";

  if (severityScore >= 8) {
    riskLevel = "high";
  } else if (severityScore >= 3) {
    riskLevel = "medium";
  }

  return {
    detectedInjection: detectedPatterns.length > 0,
    detectedPatterns,
    severityScore,
    riskLevel,
  };
}

function neutralisePromptInjection(input: string): string {
  let output = input;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    output = output.replace(
      pattern.regex,
      "[REMOVED_PROMPT_INJECTION_ATTEMPT]"
    );
  }

  return output;
}

function redactPii(input: string) {
  let output = input;
  const redactions: string[] = [];

  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(output)) {
      redactions.push(pattern.label);
      output = output.replace(pattern.regex, pattern.replacement);
    }
  }

  return {
    text: output,
    redactions,
  };
}

function isEmotionallyImportant(line: string): boolean {
  const lower = line.toLowerCase();

  return EMOTIONALLY_IMPORTANT_KEYWORDS.some((keyword) =>
    lower.includes(keyword)
  );
}

function compressChatText(input: string, maxChars: number): string {
  const text = normaliseText(input);

  if (text.length <= maxChars) {
    return text;
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLines = lines.slice(0, 30);
  const lastLines = lines.slice(-50);

  const importantLines = lines.filter((line) => {
    return isEmotionallyImportant(line) || line.includes("?") || line.length > 120;
  });

  const uniqueLines = Array.from(
    new Set([...firstLines, ...importantLines, ...lastLines])
  );

  let compressed = uniqueLines.join("\n");

  if (compressed.length > maxChars) {
    compressed = compressed.slice(0, maxChars);
  }

  return compressed.trim();
}

export function preLlmGuard(
  rawInput: string,
  options: GuardOptions = {}
): GuardResult {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const blockHighRisk = options.blockHighRisk ?? true;

  const originalText = rawInput || "";
  const originalCharCount = originalText.length;

  const normalised = normaliseText(originalText);

  const injectionResult = detectPromptInjection(normalised);

  let riskLevel: RiskLevel = injectionResult.riskLevel;

  const neutralised = neutralisePromptInjection(normalised);

  const piiResult = redactPii(neutralised);

  const cleanedText = normaliseText(piiResult.text);

  const compressedText = compressChatText(cleanedText, maxChars);

  const warnings: string[] = [];

  if (injectionResult.detectedInjection) {
    warnings.push(
      "Prompt injection-like instructions were detected and neutralised."
    );
  }

  if (piiResult.redactions.length > 0) {
    warnings.push("Sensitive personal information was redacted.");
  }

  if (compressedText.length < cleanedText.length) {
    warnings.push("Input was compressed before sending to the LLM.");
  }

  let safeForLlm = true;

  if (blockHighRisk && riskLevel === "high") {
    safeForLlm = false;
    riskLevel = "blocked";
    warnings.push("High-risk prompt injection detected. LLM call blocked.");
  }

  return {
    safeForLlm,
    riskLevel,
    originalText,
    cleanedText,
    compressedText,
    detectedInjection: injectionResult.detectedInjection,
    detectedPatterns: injectionResult.detectedPatterns,
    redactions: piiResult.redactions,
    originalCharCount,
    cleanedCharCount: cleanedText.length,
    compressedCharCount: compressedText.length,
    warnings,
  };
}
