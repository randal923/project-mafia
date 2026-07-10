import type { MissionTemplate } from "./missionTemplate";
import type { PlayerSkills } from "./player";

/**
 * Ways to play a beat. Each approach rolls exactly one skill — to make a
 * new skill rollable on jobs, add the skill in skills.ts and one approach
 * entry here; the skeleton builder, prompts, and UI pick it up from this
 * list.
 */
export const JOB_APPROACHES = [
  "charm",
  "deception",
  "force",
  "opportunistic",
  "quiet",
  "social",
  "technical",
] as const;

export type JobApproach = (typeof JOB_APPROACHES)[number];

/** Which skill each approach checks. */
export const APPROACH_SKILLS: Record<JobApproach, keyof PlayerSkills> = {
  charm: "charisma",
  deception: "corruption",
  force: "muscle",
  opportunistic: "strategy",
  quiet: "stealth",
  social: "leadership",
  technical: "tech",
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

/** Gear a job may call for, listed on the offer so the player can shop. */
export type JobOfferGear = {
  /** Whether using it spends one (grenades yes, crowbars no). */
  consumes: boolean;
  label: string;
  /** Owning ANY item with one of these tags covers the demand. */
  tags: string[];
};

/** A job on the board. All numbers are engine-computed, never LLM-set. */
export type JobOffer = {
  difficulty: number;
  district: JobDistrict;
  /** Gear the job's choices may demand; absent on older boards. */
  gear?: JobOfferGear[];
  heatIncrease: number;
  id: string;
  rewardMax: number;
  rewardMin: number;
  /** Stamina spent on accept; absent on boards built before the knob. */
  staminaCost?: number;
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
 * Gear a choice calls for. Decided at accept time from the template and
 * the player's inventory: with the gear the check gets easier and any
 * consumable is spent on use; without it the player improvises and the
 * check gets harder.
 */
export type EdgeGear = {
  /** Whether taking the edge spends one of the matching consumables. */
  consumes: boolean;
  /** Short display name, e.g. "Flashbang" or "Breaching charge". */
  label: string;
  /** True if the player owned matching gear when the job was accepted. */
  satisfied: boolean;
  /** Owning ANY item with one of these tags satisfies the requirement. */
  tags: string[];
};

/**
 * An edge from a beat node to one of its children. The roll is pre-computed
 * at accept time and must never reach the client before the edge is taken.
 */
export type ChoiceEdge = {
  approach: JobApproach;
  check: SkillCheck;
  gear: EdgeGear | null;
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
  /** Player levels gained when the job resolved; absent on older docs. */
  levelsGained?: number;
  narrativeEventId: string;
  /** Exact skill XP awarded along the selected path; absent on older docs. */
  skillExperienceGained?: SkillExperienceSummary;
  tier: OutcomeTier;
  xpChange: number;
};

export type SkillExperiencePreview = {
  criticalSuccess: number;
  success: number;
};

export type SkillExperienceSummary = Partial<
  Record<keyof PlayerSkills, number>
>;

export type MissionChoiceOdds = {
  failure: number;
  success: number;
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
  gear: EdgeGear | null;
  id: string;
  label: string | null;
  margin: number;
  passed: boolean;
};

/** An outgoing choice as shown to the client — check specs, never rolls. */
export type MissionViewChoice = {
  approach: JobApproach;
  check: SkillCheck;
  gear: EdgeGear | null;
  id: string;
  intent: string | null;
  label: string | null;
  odds: MissionChoiceOdds;
  riskHint: string | null;
  /** Null only for missions stored before skill-XP settings were snapshotted. */
  skillExperience: SkillExperiencePreview | null;
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
