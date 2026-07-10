import type { JobDistrict, OutcomeTier } from "./job";

export type NarrativeEventType = "job_resolved";

/** Append-only world-story record emitted when a mission resolves. */
export type NarrativeEvent = {
  cashChange: number;
  createdAt: string;
  district: JobDistrict;
  heatChange: number;
  id: string;
  missionId: string;
  outcomeTier: OutcomeTier;
  summary: string;
  title: string;
  type: NarrativeEventType;
};

export type PlayerLlmMemory = {
  importantFacts: string[];
  unresolvedConflicts: string[];
};

export type PlayerNarrative = {
  llmMemory: PlayerLlmMemory;
  /** Rolling recap of the player's story, fed to the game master prompt. */
  storySummary: string;
};

export const STORY_SUMMARY_MAX_LENGTH = 1000;

export function createEmptyNarrative(): PlayerNarrative {
  return {
    llmMemory: {
      importantFacts: [],
      unresolvedConflicts: [],
    },
    storySummary: "",
  };
}

/** Appends to the rolling summary, keeping only the most recent characters. */
export function appendStorySummary(existing: string, addition: string): string {
  const combined = [existing.trim(), addition.trim()]
    .filter(Boolean)
    .join(" ");

  return combined.length <= STORY_SUMMARY_MAX_LENGTH
    ? combined
    : combined.slice(combined.length - STORY_SUMMARY_MAX_LENGTH);
}
