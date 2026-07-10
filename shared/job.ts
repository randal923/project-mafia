import type { MissionTemplate } from "./missionTemplate";
import type { PlayerSkills } from "./player";

export const JOB_APPROACHES = [
  "deception",
  "force",
  "opportunistic",
  "quiet",
  "social",
] as const;

export type JobApproach = (typeof JOB_APPROACHES)[number];

/**
 * Which skill each approach checks. `business` is deliberately unused —
 * reserved for future trade/fence job types.
 */
export const APPROACH_SKILLS: Record<JobApproach, keyof PlayerSkills> = {
  deception: "corruption",
  force: "muscle",
  opportunistic: "strategy",
  quiet: "stealth",
  social: "leadership",
};

export const OUTCOME_TIERS = [
  "jackpot",
  "successful",
  "partially_successful",
  "partial_failure",
  "failure",
  "disaster",
] as const;

export type OutcomeTier = (typeof OUTCOME_TIERS)[number];

/** Free-form strings — defined by mission template files, not code. */
export type JobType = string;
export type JobDistrict = string;

export const MIN_MISSION_DEPTH = 3;
export const MAX_MISSION_DEPTH = 5;

export type JobStorySeed = {
  location: string;
  premise: string;
  pressure: string;
};

/** A job on the board. All numbers are engine-computed, never LLM-set. */
export type JobOffer = {
  difficulty: number;
  district: JobDistrict;
  heatIncrease: number;
  id: string;
  rewardMax: number;
  rewardMin: number;
  storySeed: JobStorySeed;
  /** Which server/missions/*.yml this offer was built from. */
  templateId: string;
  type: JobType;
};

export type JobBoard = {
  generatedAt: string;
  offers: JobOffer[];
  /** Sorted template ids the board was built from; a mismatch with the
   * currently loaded mission files triggers a regenerate. */
  templatesKey?: string;
};

export type SkillCheck = {
  difficulty: number;
  skill: keyof PlayerSkills;
};

export type CheckRoll = {
  margin: number;
  passChance: number;
  passed: boolean;
  value: number;
};

/**
 * An edge from a beat node to one of its children. The roll is pre-computed
 * at accept time and must never reach the client before the edge is taken.
 */
export type ChoiceEdge = {
  approach: JobApproach;
  check: SkillCheck;
  /** Equals the child node id, e.g. "01". */
  id: string;
  intent: string | null;
  label: string | null;
  momentumDelta: number;
  riskHint: string | null;
  roll: CheckRoll;
};

export type MissionNodeKind = "beat" | "outcome";
export type NodeNarrativeStatus = "pending" | "ready";

export type NodeNarrative = {
  body: string;
  stakes: string | null;
  /** One-sentence recap, only written on outcome nodes. */
  storySummary: string | null;
  title: string;
};

export type MissionNode = {
  /** Exactly 2 on beats, null on outcomes. */
  choices: ChoiceEdge[] | null;
  depth: number;
  /** Binary path string: "" (root), "0", "1", "00" ... "111". */
  id: string;
  kind: MissionNodeKind;
  /** Cumulative momentum entering this node — known at accept time. */
  momentum: number;
  narrative: NodeNarrative | null;
  narrativeStatus: NodeNarrativeStatus;
  /** Outcome nodes only, known at accept time. */
  outcomeTier: OutcomeTier | null;
};

export type MissionStatus = "active" | "generating" | "resolved";

export type MissionResolution = {
  cashChange: number;
  heatChange: number;
  narrativeEventId: string;
  tier: OutcomeTier;
  xpChange: number;
};

export type Mission = {
  choicePath: string[];
  createdAt: string;
  currentNodeId: string;
  depth: number;
  generationStartedAt: string | null;
  id: string;
  nodes: Record<string, MissionNode>;
  /** Snapshot of the accepted offer. */
  offer: JobOffer;
  promptVersion: string;
  resolution: MissionResolution | null;
  /** RNG seed; the whole tree is reproducible from (seed, missionId). */
  seed: string;
  status: MissionStatus;
  /** Snapshot of the template at accept time, immune to later yml edits. */
  template: MissionTemplate;
  uid: string;
  updatedAt: string;
};

/** A past edge whose check result has been revealed by taking it. */
export type RevealedEdge = {
  approach: JobApproach;
  check: SkillCheck;
  id: string;
  label: string | null;
  margin: number;
  passed: boolean;
};

/** An outgoing choice as shown to the client — check specs, never rolls. */
export type MissionViewChoice = {
  approach: JobApproach;
  check: SkillCheck;
  id: string;
  intent: string | null;
  label: string | null;
  riskHint: string | null;
};

export type MissionViewStep = {
  /** The edge that led into this node; null on the intro. */
  edgeTaken: RevealedEdge | null;
  kind: MissionNodeKind;
  narrative: NodeNarrative | null;
  narrativeStatus: NodeNarrativeStatus;
  nodeId: string;
  /** Only present once the node is reached and it is an outcome. */
  outcomeTier: OutcomeTier | null;
};

/** Redacted mission sent to the client. Unvisited branches never appear. */
export type MissionView = {
  /** Outgoing choices of the current node; null on outcome nodes. */
  choices: MissionViewChoice[] | null;
  createdAt: string;
  depth: number;
  id: string;
  narrativeProgress: {
    ready: number;
    total: number;
  };
  offer: JobOffer;
  resolution: MissionResolution | null;
  status: MissionStatus;
  /** Visited nodes in order; the last step is the current node. */
  steps: MissionViewStep[];
  updatedAt: string;
};
