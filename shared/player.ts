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
  category?: string;
  detail?: string;
  id: string;
  image?: {
    alt: string;
    src: string;
  };
  name: string;
  power?: number;
  quantity?: number;
  tone?: PlayerItemTone;
};

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
  business: number;
  corruption: number;
  leadership: number;
  muscle: number;
  stealth: number;
  strategy: number;
};

/** Experience earned per skill by passing checks with it. */
export type PlayerSkillExperience = Record<keyof PlayerSkills, number>;

export function createEmptySkillExperience(): PlayerSkillExperience {
  return {
    business: 0,
    corruption: 0,
    leadership: 0,
    muscle: 0,
    stealth: 0,
    strategy: 0,
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
        business: 0,
        corruption: 0,
        leadership: 1,
        muscle: 1,
        stealth: 1,
        strategy: 1,
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

/** Fills fields that predate them on stored player docs (heat, narrative). */
export function normalizePlayer(player: Player): Player {
  return {
    ...player,
    narrative: player.narrative ?? createEmptyNarrative(),
    progression: {
      ...player.progression,
      skillExperience:
        player.progression.skillExperience ?? createEmptySkillExperience(),
    },
    resources: {
      cash: player.resources.cash,
      heat: player.resources.heat ?? 0,
      power: player.resources.power,
    },
  };
}
