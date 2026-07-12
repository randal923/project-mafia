import type { BuildingInstance } from "./building";
import type { DistrictId } from "./district";

/**
 * A turf is the atomic unit of city control. Static shape (name, slots,
 * base defense, grid position) comes from the city map seed; ownership and
 * buildings are season state at seasons/{seasonId}/turfs/{turfId}.
 */
export type TurfStatic = {
  /** Base resistance to takeovers before crew and buildings pile on. */
  baseDefense: number;
  /** How many rackets fit on this turf. */
  buildingSlots: number;
  district: DistrictId;
  id: string;
  /** Set when a one-of-a-kind landmark stands here. */
  landmarkId: string | null;
  name: string;
  /** Grid position on the city map SVG (columns x, rows y). */
  x: number;
  y: number;
};

export type TurfState = TurfStatic & {
  /** Crew member ids the OWNER has posted here as defenders. */
  assignedCrew: string[];
  buildings: BuildingInstance[];
  claimedAt: string | null;
  /** Battle damage to defenses; heals when the owner repairs the turf. */
  defenseDamage: number;
  /** ISO time the turf's own till (base district income) last accrued. */
  incomeAccruedAt: string;
  /** Base district income sitting in the turf till, capped like buildings. */
  storedIncome: number;
  /** Family color of the owner, denormalized for one-read map paints. */
  ownerColor: string | null;
  ownerName: string | null;
  ownerUid: string | null;
  /** No attacks may target this turf until then. */
  shieldUntil: string | null;
  updatedAt: string;
};

/** Family identity, chosen when the map unlocks. Lives on the player doc. */
export type PlayerFamily = {
  color: string;
  /** New families are shielded from attack for NEW_FAMILY_SHIELD_HOURS. */
  foundedAt: string;
  /** The mafia's name — what the map, battles, and the Ledger print. */
  name: string;
  /** Lowercased, whitespace-collapsed name used for uniqueness checks. */
  nameKey: string;
};

export const FAMILY_NAME_MIN_LENGTH = 3;
export const FAMILY_NAME_MAX_LENGTH = 24;

/** Normalizes a family name for uniqueness comparison. */
export function familyNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** The palette families pick their map color from. */
export const FAMILY_COLORS = [
  "#b3413a",
  "#b8862d",
  "#7c9c3b",
  "#3d8f7a",
  "#3f7fae",
  "#6a5aa8",
  "#a4508b",
  "#c26d3f",
  "#5b8a72",
  "#8a4f5e",
  "#4a6d9c",
  "#96803a",
] as const;

/** Rank at which the map, turf, and family identity unlock. */
export const TERRITORY_UNLOCK_RANK = "local_boss";

/** Fresh conquests and fresh players get breathing room. */
export const CAPTURE_SHIELD_HOURS = 8;
export const NEW_FAMILY_SHIELD_HOURS = 72;

/** Crew posted on a turf defend at double weight — they know the ground. */
export const TURF_CREW_DEFENSE_FACTOR = 2;
/** Each racket level on the turf adds this much defense. */
export const TURF_BUILDING_DEFENSE_PER_LEVEL = 5;
/** Defense never drops below this, however battered. */
export const MIN_TURF_DEFENSE = 5;

/**
 * Effective defense of a turf: ground + posted crew + rackets − battle
 * damage. `crewPower` is the summed power of assigned defenders; landmark
 * garrisons pass their garrison power the same way.
 */
export function turfDefense(
  turf: Pick<TurfState, "baseDefense" | "buildings" | "defenseDamage">,
  crewPower: number,
): number {
  const buildingDefense = turf.buildings.reduce(
    (sum, building) =>
      sum + (building.damaged ? 0 : building.level * TURF_BUILDING_DEFENSE_PER_LEVEL),
    0,
  );

  return Math.max(
    MIN_TURF_DEFENSE,
    turf.baseDefense +
      buildingDefense +
      crewPower * TURF_CREW_DEFENSE_FACTOR -
      turf.defenseDamage,
  );
}

/**
 * Holding ground costs money, and superlinearly so — an empire stretched
 * across the city bleeds cash into guards, payoffs, and patched fences.
 * Total upkeep per game day (= real hour) across `turfCount` turfs.
 */
export function turfUpkeepPerDay(turfCount: number): number {
  if (turfCount <= 0) {
    return 0;
  }
  return Math.round((20 * Math.pow(turfCount, 1.5)) / 5) * 5;
}

/** Two turfs are adjacent when their grid cells touch orthogonally. */
export function turfsAdjacent(
  a: Pick<TurfStatic, "x" | "y">,
  b: Pick<TurfStatic, "x" | "y">,
): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

/** Majority control of a district: strictly more than half its turfs. */
export function controlsDistrictMajority(
  ownedInDistrict: number,
  districtTurfCount: number,
): boolean {
  return ownedInDistrict * 2 > districtTurfCount;
}

/** Income bonus for majority control of a district. */
export const DISTRICT_MAJORITY_INCOME_FACTOR = 1.15;

/** Whether an attack from `attackerTurfs` may target `target`: any owned
 * turf adjacent to it, or any foothold in the same district. */
export function canReachTurf(
  target: TurfStatic,
  attackerTurfs: Pick<TurfStatic, "district" | "x" | "y">[],
): boolean {
  return attackerTurfs.some(
    (owned) =>
      owned.district === target.district || turfsAdjacent(owned, target),
  );
}
