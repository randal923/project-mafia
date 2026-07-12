import type { OutcomeTier } from "./job";

/**
 * Attacks resolve asynchronously through the same seeded d100 machinery
 * as jobs: the attacker's committed force clashes with the turf's defense
 * three times; wins map onto the outcome-tier vocabulary. No live defender
 * is ever required.
 */
export const BATTLE_CLASH_COUNT = 3;

/** Wins → tier. 3 sweeps, 2 takes the turf, 1 dents it, 0 is a rout. */
export const BATTLE_TIER_BY_WINS: Record<number, OutcomeTier> = {
  0: "disaster",
  1: "partial_failure",
  2: "successful",
  3: "jackpot",
};

/**
 * Chance the attacker takes one clash. Pure force ratio, softened toward
 * the middle so a big stack is favored but never safe, then clamped to
 * the same 5..95 band as job checks.
 */
export function clashWinChance(attackPower: number, defensePower: number): number {
  const total = Math.max(1, attackPower + defensePower);
  const ratio = attackPower / total;
  return Math.min(95, Math.max(5, Math.round(20 + 60 * ratio)));
}

/** Cash stake to launch an assault — scales with what you're biting off. */
export function attackStake(defensePower: number): number {
  return Math.round((10 * defensePower) / 5) * 5;
}

/** Launching an assault is work: flat stamina cost. */
export const ATTACK_STAMINA_COST = 30;

/** Heat for going to war; disasters double it. */
export const ATTACK_HEAT = 8;

/** Hours after losing a defense during which revenge ignores adjacency. */
export const REVENGE_WINDOW_HOURS = 24;
/** Revenge strikes catch defenses off guard. */
export const REVENGE_DEFENSE_FACTOR = 0.8;

/** One assault per attacker per this many real minutes. */
export const ATTACK_COOLDOWN_MINUTES = 30;

/** Share of a captured till the attacker pockets on a jackpot sweep. */
export const JACKPOT_SKIM_FACTOR = 1;
/** Share pocketed on a plain successful capture. */
export const CAPTURE_SKIM_FACTOR = 0.5;

/** Defense damage a failed-but-not-routed assault leaves behind. */
export function defenseDamageDealt(defensePower: number): number {
  return Math.max(3, Math.round(defensePower * 0.15));
}

export type BattleCrewSnapshot = {
  id: string;
  name: string;
  power: number;
};

export type BattleCasualties = {
  dead: BattleCrewSnapshot[];
  imprisoned: BattleCrewSnapshot[];
  injured: BattleCrewSnapshot[];
};

export type BattleKind = "landmark_siege" | "turf_assault";

/** Immutable record of a resolved assault, at seasons/{id}/battles/{id}. */
export type BattleReport = {
  attackerCasualties: BattleCasualties;
  attackerCrew: BattleCrewSnapshot[];
  attackerName: string;
  attackerUid: string;
  attackPower: number;
  /** City bounty collected because the defender was the posted target. */
  bountyCollected?: number;
  clashChance: number;
  clashesWon: number;
  createdAt: string;
  defenderCasualties: BattleCasualties;
  /** Null when storming an NPC landmark garrison. */
  defenderName: string | null;
  defenderUid: string | null;
  defensePower: number;
  heatGained: number;
  id: string;
  incomeSkimmed: number;
  kind: BattleKind;
  /** Whether this strike consumed the attacker's revenge window. */
  revenge: boolean;
  seasonId: string;
  stake: number;
  tier: OutcomeTier;
  turfFlipped: boolean;
  turfId: string;
  turfName: string;
};
