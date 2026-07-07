import type {
  Job,
  JobStoryChoice,
  JobStoryScene,
} from "../../models/job";
import type { NarrativeEvent, Player, StoryThread } from "../../models/player";

export type AIIntroInput = {
  job: Job;
  player: Player;
};

export type AIChoiceInput = {
  choice: JobStoryChoice;
  choicePath: JobStoryChoice[];
  job: Job;
  player: Player;
  story: JobStoryScene;
};

export type LLMRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export type PlayerPromptContext = {
  activeStoryThreads: Pick<
    StoryThread,
    "possibleNextBeats" | "relatedDistrictIds" | "relatedFactionIds" | "summary" | "tension" | "title"
  >[];
  effectivePower: number;
  heat: number;
  importantFacts: string[];
  majorEvents: Pick<
    NarrativeEvent,
    "districtId" | "relatedFactionIds" | "summary" | "title" | "type"
  >[];
  money: {
    clean: number;
    dirty: number;
  };
  name: string;
  preferredJobThemes: string[];
  rank: Player["rank"];
  storySummary: string;
  unresolvedConflicts: string[];
};

export type JsonObject = Record<string, unknown>;
