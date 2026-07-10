import { createEmptyNarrative, type PlayerNarrative } from "./narrative";
import { playerNameKey } from "./playerSchemas";

export const PLAYER_RANKS = [
  "nobody",
  "street_hustler",
  "crew_leader",
  "local_boss",
  "district_boss",
  "crime_lord",
  "city_kingpin",
] as const;

export type PlayerRank = (typeof PLAYER_RANKS)[number];

export type PlayerItemTone = "brass" | "danger" | "neutral" | "profit" | "teal";

export type PlayerItem = {
  armor?: number;
  category?: string;
  consumable?: boolean;
  detail?: string;
  effects?: PlayerItemEffect[];
  id: string;
  image?: {
    alt: string;
    src: string;
  };
  levelRequirement?: number;
  name: string;
  power?: number;
  price?: number;
  quantity?: number;
  /** Which loadout slot this item can be equipped in; absent = stash-only. */
  slot?: EquipmentSlotId;
  tags?: string[];
  tone?: PlayerItemTone;
};

/** Passive bonuses an equipped item grants. Mirrors EquipmentEffect. */
export type PlayerItemEffect =
  | { type: "approachBonus"; approach: string; value: number }
  | { type: "heatReduction"; value: number }
  | { type: "skillBonus"; skill: keyof PlayerSkills; value: number };

export type EquipmentSlotId = "feet" | "hand" | "head" | "torso" | "waist";

export type PlayerLoadout = Partial<Record<EquipmentSlotId, PlayerItem>>;

export const MAX_HEAT = 100;

export type PlayerResources = {
  cash: number;
  /** Police attention, 0-100. Raised by jobs, raises job risk. */
  heat: number;
  power: number;
};

export type PlayerSkills = {
  corruption: number;
  leadership: number;
  muscle: number;
  stealth: number;
  strategy: number;
  /** Locks, wires, alarms, explosives — the technical trades. */
  tech: number;
};

/** Experience earned per skill by passing checks with it. */
export type PlayerSkillExperience = Record<keyof PlayerSkills, number>;

export function createEmptySkillExperience(): PlayerSkillExperience {
  return {
    corruption: 0,
    leadership: 0,
    muscle: 0,
    stealth: 0,
    strategy: 0,
    tech: 0,
  };
}

export type PlayerProgression = {
  experience: number;
  level: number;
  skillExperience: PlayerSkillExperience;
  skillPoints: number;
  skills: PlayerSkills;
};

export type Player = {
  avatar: string | null;
  createdAt: string;
  id: string;
  loadout: PlayerLoadout;
  name: string;
  /** Lowercased, whitespace-collapsed name used for uniqueness checks. */
  nameKey: string;
  narrative: PlayerNarrative;
  progression: PlayerProgression;
  rank: PlayerRank;
  resources: PlayerResources;
  stash: PlayerItem[];
  updatedAt: string;
};

export function createNewPlayer(
  id: string,
  name: string,
  nowIso: string,
  loadout: PlayerLoadout = {},
): Player {
  return {
    avatar: null,
    createdAt: nowIso,
    id,
    loadout,
    name,
    nameKey: playerNameKey(name),
    narrative: createEmptyNarrative(),
    progression: {
      experience: 0,
      level: 1,
      skillExperience: createEmptySkillExperience(),
      skillPoints: 0,
      skills: {
        corruption: 1,
        leadership: 1,
        muscle: 1,
        stealth: 1,
        strategy: 1,
        tech: 1,
      },
    },
    rank: "nobody",
    resources: {
      cash: 0,
      heat: 0,
      power: 2,
    },
    stash: [],
    updatedAt: nowIso,
  };
}

/**
 * Fills fields that predate them on stored player docs (heat, narrative)
 * and migrates the retired `business` skill into `tech`.
 */
export function normalizePlayer(player: Player): Player {
  return {
    ...player,
    narrative: player.narrative ?? createEmptyNarrative(),
    progression: {
      ...player.progression,
      skillExperience: normalizeSkillRecord(
        player.progression.skillExperience,
        createEmptySkillExperience(),
      ),
      skills: normalizeSkillRecord(player.progression.skills, {
        corruption: 1,
        leadership: 1,
        muscle: 1,
        stealth: 1,
        strategy: 1,
        tech: 1,
      }),
    },
    resources: {
      cash: player.resources.cash,
      heat: player.resources.heat ?? 0,
      power: player.resources.power,
    },
  };
}

function normalizeSkillRecord<T extends Record<keyof PlayerSkills, number>>(
  stored: T | undefined,
  fallback: T,
): T {
  if (!stored) {
    return fallback;
  }

  const legacy = stored as T & { business?: number };
  return {
    corruption: legacy.corruption ?? fallback.corruption,
    leadership: legacy.leadership ?? fallback.leadership,
    muscle: legacy.muscle ?? fallback.muscle,
    stealth: legacy.stealth ?? fallback.stealth,
    strategy: legacy.strategy ?? fallback.strategy,
    // The old `business` skill was never rollable; its points move to tech.
    tech: legacy.tech ?? legacy.business ?? fallback.tech,
  } as T;
}
