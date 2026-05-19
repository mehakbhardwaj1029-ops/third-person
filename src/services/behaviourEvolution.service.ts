
import {
  mergeTraits,
  mergePatterns,
  mergeMbti,
  mergeRelationship,
} from "../utils/behaviourMerge";
type ChunkAnalysis = {
  summary: string;

  signals: {
    emotions: string[];
    relationshipSignals: string[];
    communicationPatterns: string[];
  };

  participants: {
    name: string;

    detectedTraits: string[];

    emotionalIndicators: string[];

    behaviorPatterns: string[];

    mbtiEvidence: string[];
  }[];

  importantEvents: string[];
};

export type BehavioralState = {
  relationship: {
    currentType: string;

    progression: string[];

    confidence: number;
  };

  participants: Record<
    string,
    {
      stableTraits: {
        trait: string;
        confidence: number;
      }[];

      communicationPatterns: {
        pattern: string;
        frequency: number;
      }[];

      mbti?: {
        type: string;
        confidence: number;
      };
    }
  >;

  emotionalDynamics: {
    trend: string;

    conflictLevel: number;

    emotionalCloseness: number;
  };
};

export function createEmptyBehavioralState(): BehavioralState {
  return {
    relationship: {
      currentType: "UNKNOWN",
      progression: [],
      confidence: 0,
    },

    participants: {},

    emotionalDynamics: {
      trend: "STABLE",
      conflictLevel: 0,
      emotionalCloseness: 0,
    },
  };
}
export async function evolveBehavioralState(
  previousState: BehavioralState | null,

  chunkAnalysis: ChunkAnalysis
): Promise<BehavioralState> {

  /*
    FIRST CHUNK
    -----------------------
    If no previous state exists,
    initialize empty behavioral state.
  */

  const state: BehavioralState = previousState ?? {
    relationship: {
      currentType: "UNKNOWN",
      progression: [],
      confidence: 0,
    },

    participants: {},

    emotionalDynamics: {
      trend: "NEUTRAL",
      conflictLevel: 0,
      emotionalCloseness: 0,
    },
  };

  /*
    RELATIONSHIP EVOLUTION
    -----------------------
    Uses relationship signals detected
    in current chunk.
  */

  state.relationship = mergeRelationship(
    state.relationship,
    chunkAnalysis.signals.relationshipSignals
  );

  /*
    PARTICIPANT EVOLUTION
    -----------------------
    Merge:
    - traits
    - communication patterns
    - mbti evidence
  */

  for (const participant of chunkAnalysis.participants) {

    /*
      create participant if missing
    */

    if (!state.participants[participant.name]) {

      state.participants[participant.name] = {
        stableTraits: [],

        communicationPatterns: [],

        mbti: undefined,
      };
    }

    const existingParticipant =
      state.participants[participant.name];

    /*
      MERGE TRAITS
    */

    existingParticipant.stableTraits =
      mergeTraits(
        existingParticipant.stableTraits,
        participant.detectedTraits
      );

    /*
      MERGE COMMUNICATION PATTERNS
    */

    existingParticipant.communicationPatterns =
      mergePatterns(
        existingParticipant.communicationPatterns,
        participant.behaviorPatterns
      );

    /*
      MERGE MBTI
    */

    existingParticipant.mbti =
      mergeMbti(
        existingParticipant.mbti,
        participant.mbtiEvidence
      );
  }

  /*
    EMOTIONAL DYNAMICS
    -----------------------
    Lightweight heuristic system.
    No LLM needed.
  */

  const emotions =
    chunkAnalysis.signals.emotions;

  /*
    conflict level
  */

  if (
    emotions.includes("anger") ||
    emotions.includes("frustration") ||
    emotions.includes("conflict")
  ) {

    state.emotionalDynamics.conflictLevel =
      Math.min(
        100,
        state.emotionalDynamics.conflictLevel + 10
      );

  } else {

    state.emotionalDynamics.conflictLevel =
      Math.max(
        0,
        state.emotionalDynamics.conflictLevel - 2
      );
  }

  /*
    emotional closeness
  */

  if (
    emotions.includes("affection") ||
    emotions.includes("support") ||
    emotions.includes("trust")
  ) {

    state.emotionalDynamics.emotionalCloseness =
      Math.min(
        100,
        state.emotionalDynamics.emotionalCloseness + 8
      );
  }

  /*
    trend detection
  */

  if (
    state.emotionalDynamics.conflictLevel > 60
  ) {

    state.emotionalDynamics.trend =
      "CONFLICT_ESCALATING";

  } else if (
    state.emotionalDynamics.emotionalCloseness > 70
  ) {

    state.emotionalDynamics.trend =
      "EMOTIONALLY_CLOSING";

  } else {

    state.emotionalDynamics.trend =
      "STABLE";
  }

  return state;
}