export type JobType = "robbery";

export type JobDistrict = "Docks";

export interface FactionImpact {
  targetFaction: string;
  respectChange: number;
}

export interface JobStorySeed {
  location: string;
  premise: string;
  pressure: string;
}

export interface Job {
  id: string;
  type: JobType;
  district: JobDistrict;
  difficulty: number;
  requiredCrew: number;
  risk: number;
  rewardMin: number;
  rewardMax: number;
  heatIncrease: number;
  factionImpact: FactionImpact;
  storySeed: JobStorySeed;
}

export const jobStoryChoiceApproaches = [
  "deception",
  "force",
  "opportunistic",
  "quiet",
  "social",
] as const;

export const minimumJobStoryChoiceDepth = 4;

export const maximumJobStoryChoiceDepth = 5;

export type JobStoryChoiceApproach =
  (typeof jobStoryChoiceApproaches)[number];

export interface JobStoryChoice {
  id: string;
  label: string;
  approach: JobStoryChoiceApproach;
  intent: string;
  riskHint: string;
}

export interface JobStoryScene {
  jobId: string;
  title: string;
  district: JobDistrict;
  scene: string;
  stakes: string;
  choices: JobStoryChoice[];
  choiceDepth: number;
  promptVersion: string;
}

export type JobIntroStory = JobStoryScene;

export type JobStoryBeat = JobStoryScene;

export type JobStoryOutcomeType =
  | "clean_success"
  | "complication"
  | "costly_success"
  | "failure"
  | "mixed_success";

export interface JobStoryFoundItem {
  name: string;
  estimatedValue: number;
  consequence: string;
}

export interface JobStoryOutcome {
  jobId: string;
  title: string;
  narration: string;
  outcome: JobStoryOutcomeType;
  moneyChange: number;
  heatChange: number;
  factionRespectChange: number;
  wound: string | null;
  foundItem: JobStoryFoundItem | null;
  storySummary: string;
  promptVersion: string;
}

export type JobStoryResolution =
  | {
      beat: JobStoryBeat;
      type: "beat";
    }
  | {
      outcome: JobStoryOutcome;
      type: "outcome";
    };
