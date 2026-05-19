export const TRAIT_INCREMENT = 0.08;

export const TRAIT_DECAY = 0.02;

export const MAX_CONFIDENCE = 1;

export const INITIAL_CONFIDENCE = 0.35;

export const MBTI_INCREMENT = 0.05;

export const MBTI_DECAY = 0.03;

export const RELATIONSHIP_INCREMENT = 0.07;

export const EMOTIONAL_CLOSENESS_INCREMENT = 0.05;

export const CONFLICT_INCREMENT = 0.06;

// ==============================
// TRAITS
// ==============================

export type StableTrait = {
  trait: string;
  confidence: number;
};

export function mergeTraits(
  existing: StableTrait[],

  incoming: string[]
): StableTrait[] {

  const updated = [...existing];

  for (const trait of incoming) {

    const found = updated.find(
      (t) => t.trait === trait
    );

    if (found) {

      found.confidence = Math.min(
        MAX_CONFIDENCE,
        found.confidence + TRAIT_INCREMENT
      );

    } else {

      updated.push({
        trait,
        confidence: INITIAL_CONFIDENCE,
      });

    }
  }

  // decay traits not seen
  for (const trait of updated) {

    if (!incoming.includes(trait.trait)) {

      trait.confidence = Math.max(
        0,
        trait.confidence - TRAIT_DECAY
      );
    }
  }

  return updated;
}

// ==============================
// COMMUNICATION PATTERNS
// ==============================

export type CommunicationPattern = {
  pattern: string;
  frequency: number;
};

export function mergePatterns(
  existing: CommunicationPattern[],

  incoming: string[]
): CommunicationPattern[] {

  const updated = [...existing];

  for (const pattern of incoming) {

    const found = updated.find(
      (p) => p.pattern === pattern
    );

    if (found) {

      found.frequency += 1;

    } else {

      updated.push({
        pattern,
        frequency: 1,
      });

    }
  }

  return updated;
}

// ==============================
// MBTI
// ==============================

export type MbtiState = {
  type: string;
  confidence: number;
};

export function mergeMbti(
  existing: MbtiState | undefined,

  incomingEvidence: string[]
): MbtiState | undefined {

  if (!incomingEvidence.length) {
    return existing;
  }

  // simplistic evidence counting
  const counts: Record<string, number> = {};

  for (const evidence of incomingEvidence) {

    counts[evidence] =
      (counts[evidence] || 0) + 1;
  }

  // get most repeated MBTI
  const topMbti =
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!topMbti) {
    return existing;
  }

  // no previous MBTI
  if (!existing) {

    return {
      type: topMbti,
      confidence: INITIAL_CONFIDENCE,
    };
  }

  // same MBTI reinforced
  if (existing.type === topMbti) {

    return {
      type: existing.type,
      confidence: Math.min(
        MAX_CONFIDENCE,
        existing.confidence + MBTI_INCREMENT
      ),
    };
  }

  // conflicting MBTI
  const reducedConfidence =
    existing.confidence - MBTI_DECAY;

  // keep previous if still stronger
  if (reducedConfidence > INITIAL_CONFIDENCE) {

    return {
      type: existing.type,
      confidence: reducedConfidence,
    };
  }

  // replace if old confidence weakened enough
  return {
    type: topMbti,
    confidence: INITIAL_CONFIDENCE,
  };
}

// ==============================
// RELATIONSHIP
// ==============================

export type RelationshipState = {
  currentType: string;

  progression: string[];

  confidence: number;
};

export function mergeRelationship(
  existing: RelationshipState,

  incomingSignals: string[]
): RelationshipState {

  let currentType = existing.currentType;

  let confidence = existing.confidence;

  const progression = [...existing.progression];

  // determine relationship category
  if (
    incomingSignals.includes(
      "emotional closeness"
    )
  ) {

    currentType = "emotionally close";

    confidence = Math.min(
      MAX_CONFIDENCE,
      confidence + RELATIONSHIP_INCREMENT
    );

    if (
      !progression.includes(
        "emotionally close"
      )
    ) {
      progression.push(
        "emotionally close"
      );
    }
  }

  if (
    incomingSignals.includes(
      "conflict"
    )
  ) {

    currentType = "conflicted";

    confidence = Math.min(
      MAX_CONFIDENCE,
      confidence + RELATIONSHIP_INCREMENT
    );

    if (
      !progression.includes(
        "conflicted"
      )
    ) {
      progression.push("conflicted");
    }
  }

  if (
    incomingSignals.includes(
      "dependency"
    )
  ) {

    currentType = "emotionally dependent";

    confidence = Math.min(
      MAX_CONFIDENCE,
      confidence + RELATIONSHIP_INCREMENT
    );

    if (
      !progression.includes(
        "emotionally dependent"
      )
    ) {
      progression.push(
        "emotionally dependent"
      );
    }
  }

  return {
    currentType,
    progression,
    confidence,
  };
}

// ==============================
// EMOTIONAL DYNAMICS
// ==============================

export type EmotionalDynamics = {
  trend: string;

  conflictLevel: number;

  emotionalCloseness: number;
};

export function mergeEmotionalDynamics(
  existing: EmotionalDynamics,

  incomingSignals: string[]
): EmotionalDynamics {

  let trend = existing.trend;

  let conflictLevel =
    existing.conflictLevel;

  let emotionalCloseness =
    existing.emotionalCloseness;

  if (
    incomingSignals.includes(
      "emotional closeness"
    )
  ) {

    emotionalCloseness = Math.min(
      1,
      emotionalCloseness +
        EMOTIONAL_CLOSENESS_INCREMENT
    );

    trend = "increasing closeness";
  }

  if (
    incomingSignals.includes(
      "conflict"
    )
  ) {

    conflictLevel = Math.min(
      1,
      conflictLevel +
        CONFLICT_INCREMENT
    );

    trend = "increasing tension";
  }

  return {
    trend,
    conflictLevel,
    emotionalCloseness,
  };
}