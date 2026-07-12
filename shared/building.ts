import type { CrewArchetypeId } from "./crew";
import type { DistrictId } from "./district";
import type { PlayerRank } from "./player";

/**
 * Buildings come in three classes on a safety-vs-value spectrum:
 * - personal: off-map holdings. Safe forever — the income floor.
 * - racket:   built on turf you control. Big income, captured with the turf.
 * - landmark: one-of-a-kind, NPC-garrisoned at season start, conquest-only.
 */
export const BUILDING_CLASSES = ["landmark", "personal", "racket"] as const;

export type BuildingClass = (typeof BUILDING_CLASSES)[number];

/** Passive perks a building grants its owner while operational. */
export type BuildingEffect =
  /** Halves (etc.) crew injury recovery time. */
  | { type: "crewHealFactor"; value: number }
  /** Player + crew recovery speed multiplier (hospital landmark). */
  | { type: "healFactor"; value: number }
  /** Extra hours of income storage on every building you own. */
  | { type: "incomeStorageBonusHours"; value: number }
  /** Multiplier on precinct bribe prices (police HQ landmark). */
  | { type: "precinctCostFactor"; value: number }
  /** Overrides the store resale factor (chop shop's fences pay better). */
  | { type: "sellPriceFactor"; value: number }
  /** Multiplier on mission stamina costs (freight yard landmark). */
  | { type: "staminaCostFactor"; value: number }
  /** Multiplier on store purchase prices (the port's smuggled stock). */
  | { type: "storePriceFactor"; value: number }
  /** Multiplier on turf upkeep (city hall landmark). */
  | { type: "upkeepFactor"; value: number }
  /** Multiplier on total crew wages (union hall landmark). */
  | { type: "wageFactor"; value: number };

export type BuildingDefinition = {
  class: BuildingClass;
  /** Purchase (personal) or construction (racket) price at level 1.
   * Landmarks are never bought — cost 0. */
  cost: number;
  description: string;
  /** Landmarks are pinned to their district; others build anywhere. */
  district?: DistrictId;
  effects?: BuildingEffect[];
  /** Base NPC garrison power (landmarks only) — scales through the season. */
  garrisonPower?: number;
  /** Heat per game day while operational: rackets run hot, fronts cool. */
  heatPerDay: number;
  id: string;
  /** Cash per real hour at level 1, fully staffed. */
  incomePerHour: number;
  name: string;
  /** Rank gate on buying/building it. */
  rankRequirement: PlayerRank;
  /** Which crew archetype staffs it at full effectiveness. */
  staffArchetype: CrewArchetypeId;
  /** Crew positions; each filled slot raises output toward 100%. */
  staffSlots: number;
};

/** A building owned by a player (Class A) or standing on a turf (B/C). */
export type BuildingInstance = {
  /** Ceased producing: captured in a fight or shut by a raid. Repairs
   * bring it back one repair fee later. */
  damaged: boolean;
  definitionId: string;
  id: string;
  /** ISO time income last accrued to storage. */
  incomeAccruedAt: string;
  level: number;
  /** Crew member ids staffing it. */
  staff: string[];
  /** Cash sitting in the till — collectable, and skimmable by raiders. */
  storedIncome: number;
  createdAt: string;
  updatedAt: string;
};

export const MAX_BUILDING_LEVEL = 5;

/** Hours of production the till holds before income stops accruing. */
export const INCOME_STORAGE_HOURS = 8;

/** Heat at which rackets start risking police raids. */
export const RAID_HEAT_THRESHOLD = 70;
/** Chance per game day (= real hour) of a raid while over the threshold. */
export const RAID_CHANCE_PER_DAY = 0.15;

/** Personal holding slots by rank — the safe part of the empire stays small. */
export const PERSONAL_BUILDING_SLOTS_BY_RANK: Record<PlayerRank, number> = {
  city_kingpin: 5,
  crew_leader: 1,
  crime_lord: 4,
  district_boss: 3,
  local_boss: 2,
  nobody: 0,
  street_hustler: 0,
};

/** Income multiplier by level: level 5 produces 3.4x its level-1 rate. */
export function buildingLevelIncomeFactor(level: number): number {
  return 1 + 0.6 * (Math.max(1, level) - 1);
}

/** Price of raising a building TO `level` (from level - 1). */
export function buildingUpgradeCost(
  definition: Pick<BuildingDefinition, "cost">,
  level: number,
): number {
  return Math.round((definition.cost * 0.7 * (level - 1)) / 5) * 5;
}

/** Everything sunk into a building at `level` — the base for repair math. */
export function buildingTotalInvested(
  definition: Pick<BuildingDefinition, "cost">,
  level: number,
): number {
  let total = definition.cost;
  for (let l = 2; l <= level; l += 1) {
    total += buildingUpgradeCost(definition, l);
  }
  return total;
}

/** Getting a captured or raided building producing again costs real money. */
export function buildingRepairCost(
  definition: Pick<BuildingDefinition, "cost">,
  level: number,
): number {
  return Math.round((0.35 * buildingTotalInvested(definition, level)) / 5) * 5;
}

export type StaffingInput = {
  archetype: CrewArchetypeId;
  /** Product of the member's trait incomeFactor modifiers. */
  incomeFactor: number;
};

/**
 * Output share from staffing: an unstaffed building limps at 40%; each
 * filled slot adds an equal share of the rest — matching archetypes count
 * in full, anyone else at half weight. Trait income modifiers multiply on
 * top, so a Greedy Face in a strip club genuinely earns his wage.
 */
export function buildingStaffFactor(
  definition: Pick<BuildingDefinition, "staffArchetype" | "staffSlots">,
  staff: StaffingInput[],
): number {
  if (definition.staffSlots <= 0) {
    return 1;
  }

  let effectiveness = 0;
  let traitFactor = 1;
  for (const member of staff.slice(0, definition.staffSlots)) {
    effectiveness += member.archetype === definition.staffArchetype ? 1 : 0.5;
    traitFactor *= member.incomeFactor;
  }

  const staffed = Math.min(1, effectiveness / definition.staffSlots);
  return (0.4 + 0.6 * staffed) * traitFactor;
}

/** Cash per real hour a building currently produces. */
export function buildingIncomeRate(
  definition: Pick<
    BuildingDefinition,
    "incomePerHour" | "staffArchetype" | "staffSlots"
  >,
  level: number,
  staff: StaffingInput[],
  damaged: boolean,
): number {
  if (damaged) {
    return 0;
  }
  return (
    definition.incomePerHour *
    buildingLevelIncomeFactor(level) *
    buildingStaffFactor(definition, staff)
  );
}

/**
 * Income accrued lazily between two timestamps, clamped to the storage
 * cap — an unattended till fills up and then just sits there, waiting for
 * the owner to collect it or a rival to skim it.
 */
export function accrueStoredIncome(
  storedIncome: number,
  ratePerHour: number,
  fromIso: string,
  toIso: string,
  storageHours = INCOME_STORAGE_HOURS,
): number {
  const elapsedMs = Date.parse(toIso) - Date.parse(fromIso);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || ratePerHour <= 0) {
    return storedIncome;
  }

  const cap = ratePerHour * storageHours;
  if (storedIncome >= cap) {
    return storedIncome;
  }

  const earned = ratePerHour * (elapsedMs / 3_600_000);
  return Math.min(cap, storedIncome + earned);
}
