import type { NarrativeEvent } from "./narrativeEvent";
import type { PlayerOrigin } from "./playerOrigin";
import type { StoryThread } from "./storyThread";

export interface PlayerNarrativeProfile {
  origin: PlayerOrigin;
  storySummary: string;
  majorEvents: NarrativeEvent[];
  activeStoryThreads: StoryThread[];
  llmMemory: {
    importantFacts: string[];
    recurringCharacters: string[];
    unresolvedConflicts: string[];
    preferredJobThemes: string[];
  };
}
