import { playerNameKey } from "./playerSchemas";

export const PLAYER_RANKS = [
  "nobody",
  "street_hustler",
  "crew_leader",
  "local_boss",
  "district_boss",
  "crime_lord",
  "city_kingpin"
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
  quantityLabel?: string;
  tone?: PlayerItemTone;
};

export type EquipmentSlotId = "feet" | "hand" | "head" | "torso" | "waist";

export type PlayerLoadout = Partial<Record<EquipmentSlotId, PlayerItem>>;

export type PlayerResources = {
  cash: number;
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

export type PlayerProgression = {
  experience: number;
  level: number;
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
  progression: PlayerProgression;
  rank: PlayerRank;
  resources: PlayerResources;
  stash: PlayerItem[];
  updatedAt: string;
};

export function createNewPlayer(id: string, name: string, nowIso: string): Player {
  return {
    avatar: null,
    createdAt: nowIso,
    id,
    loadout: {},
    name,
    nameKey: playerNameKey(name),
    progression: {
      experience: 0,
      level: 1,
      skillPoints: 0,
      skills: {
        business: 0,
        corruption: 0,
        leadership: 1,
        muscle: 1,
        stealth: 1,
        strategy: 1
      }
    },
    rank: "nobody",
    resources: {
      cash: 500,
      power: 0
    },
    stash: [],
    updatedAt: nowIso
  };
}
