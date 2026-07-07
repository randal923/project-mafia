import type {
  Job,
  JobIntroStory,
  JobStoryChoice,
  JobStoryResolution,
  JobStoryScene,
} from "../../models/job";
import type { PlayerRank } from "../../models/player";
import type { AppErrorResult } from "../errors";

export type JobsResponse = {
  jobs: Job[];
};

export type JobIntroResponse = {
  story: JobIntroStory;
};

export type JobChoiceResponse = {
  resolution: JobStoryResolution;
};

export type JobsServiceSuccess = {
  jobs: Job[];
  ok: true;
};

export type JobIntroSuccess = {
  ok: true;
  story: JobIntroStory;
};

export type JobChoiceSuccess = {
  ok: true;
  resolution: JobStoryResolution;
};

export type JobsServiceFailure = {
  error: AppErrorResult;
  ok: false;
};

export type JobsServiceResult = JobsServiceFailure | JobsServiceSuccess;

export type JobIntroResult = JobIntroSuccess | JobsServiceFailure;

export type JobChoiceResult = JobChoiceSuccess | JobsServiceFailure;

export type RankProfile = {
  tier: number;
};

export type JobGenerationContext = {
  effectivePower: number;
  heat: number;
  rank: PlayerRank;
  rankTier: number;
};

export type RobberyJobCalculations = {
  difficulty: number;
  factionRespectChange: number;
  heatIncrease: number;
  heatPressure: number;
  powerTier: number;
  requiredCrew: number;
  rewardMax: number;
  rewardMin: number;
  risk: number;
};

export type ResolveJobChoiceRequest = {
  choice: JobStoryChoice;
  choicePath: JobStoryChoice[];
  jobId: string;
  story: JobStoryScene;
};
