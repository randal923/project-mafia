import {
  ChoiceEdge,
  Mission,
  MissionNode,
  NodeNarrative,
} from "../../../../shared/job";
import { Player } from "../../../../shared/player";
import { MissionRewards } from "../../engine/RewardService";

export type BeatChoiceText = {
  intent: string;
  label: string;
  riskHint: string;
};

export type NarrationInput = {
  /** Visited-path narratives from root to this node's parent, in order. */
  ancestors: MissionNode[];
  /** The edge taken into this node; null on the intro. */
  edgeTaken: ChoiceEdge | null;
  mission: Mission;
  node: MissionNode;
  player: Player;
};

export type OutcomeNarrationInput = NarrationInput & {
  /** Engine-computed rewards the narration must reference, never change. */
  rewards: MissionRewards;
};

export type BeatNarrationResult = {
  choices: BeatChoiceText[];
  narrative: NodeNarrative;
  status: "fallback" | "ready";
};

export type OutcomeNarrationResult = {
  narrative: NodeNarrative;
  status: "fallback" | "ready";
};

/**
 * Writes the story around engine facts. Implementations narrate KNOWN
 * results (pre-rolled checks, computed tiers) — they never decide them.
 */
export interface MissionNarrator {
  narrateBeat(input: NarrationInput): Promise<BeatNarrationResult>;
  narrateOutcome(input: OutcomeNarrationInput): Promise<OutcomeNarrationResult>;
}
