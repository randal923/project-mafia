import { createEmptyNarrative, type PlayerNarrative } from "./narrative";
import { MAX_HEALTH, MIN_HEALTH } from "./health";
import { playerNameKey } from "./playerSchemas";
import type { PlayerFamily } from "./territory";
import type { JobApproach } from "./job";
import {
  SKILL_IDS,
  STARTING_SKILL_LEVEL,
  SkillId,
  createSkillRecord,
} from "./skills";

import type { PlayerLanguage } from "./language";

export type { PlayerLanguage } from "./language";

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
  /** Consumed-on-use effect (drugs/liquor): stamina, heat delta, buzz. */
  use?: {
    drunk?: number;
    health?: number;
    heat?: number;
    high?: number;
    stamina?: number;
  };
};

/** Passive bonuses an equipped item grants. Mirrors EquipmentEffect. */
export type PlayerItemEffect =
  | { type: "approachBonus"; approach: JobApproach; value: number }
  | { type: "heatReduction"; value: number }
  | { type: "skillBonus"; skill: keyof PlayerSkills; value: number };

export type EquipmentSlotId = "feet" | "hand" | "head" | "torso" | "waist";

export type PlayerLoadout = Partial<Record<EquipmentSlotId, PlayerItem>>;

export const MAX_HEAT = 100;
export const MAX_STAMINA = 100;

export type PlayerResources = {
  cash: number;
  /** How drunk, 0-100. Alcohol raises it; it debuffs checks and sobers off idle. */
  drunk: number;
  /** Physical condition, 1-100. Mission damage lowers it; kits and rest restore it. */
  health: number;
  /** Police attention, 0-100. Raised by jobs, raises job risk. */
  heat: number;
  /** How high, 0-100. Drugs raise it; it debuffs checks and builds tolerance. */
  high: number;
  power: number;
  /** Energy for jobs, 0-100. Regenerates while idle; drugs refill it. */
  stamina: number;
};

/**
 * Skill levels, keyed by the registry in skills.ts — adding a skill there
 * automatically extends this record.
 */
export type PlayerSkills = Record<SkillId, number>;

/** Experience earned per skill by passing checks with it. */
export type PlayerSkillExperience = Record<SkillId, number>;

export function createEmptySkillExperience(): PlayerSkillExperience {
  return createSkillRecord(0);
}

/** The family's standing in the street war. Kept on the player doc so
 * attack cooldowns and revenge rights never need cross-collection queries. */
export type PlayerWar = {
  /** Last assault launched; the next one waits out the cooldown. */
  lastAttackAt: string | null;
  /** Losing a defense grants this: hit that family back within the
   * window, adjacency waived and their defenses caught leaning. */
  revenge: {
    againstUid: string;
    expiresAt: string;
  } | null;
};

export function createEmptyWar(): PlayerWar {
  return { lastAttackAt: null, revenge: null };
}

/** Set while the player is locked up; null when free. */
export type PlayerPrison = {
  /** Next bribe/escape attempt allowed at (throttles retries). */
  attemptCooldownUntil: string | null;
  /** Narrative context: which job put them here. */
  reason: string;
  /** Locale used to author `reason`; absent legacy records are English. */
  reasonLanguage?: PlayerLanguage;
  releaseAt: string;
  sentencedAt: string;
};

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
  /** Family identity for the city map; null until founded at map unlock. */
  family: PlayerFamily | null;
  id: string;
  /** UI/narration language. Null until first set, so clients can seed it
   * from the browser language on first login. */
  language: PlayerLanguage | null;
  loadout: PlayerLoadout;
  name: string;
  /** Lowercased, whitespace-collapsed name used for uniqueness checks. */
  nameKey: string;
  narrative: PlayerNarrative;
  prison: PlayerPrison | null;
  progression: PlayerProgression;
  rank: PlayerRank;
  resources: PlayerResources;
  /** Exact equipment held aside for the active mission's precomputed paths. */
  reservedEquipment: {
    items: Record<string, number>;
    missionId: string;
  } | null;
  stash: PlayerItem[];
  updatedAt: string;
  war: PlayerWar;
};

export function createNewPlayer(
  id: string,
  name: string,
  nowIso: string,
  loadout: PlayerLoadout = {},
  language: PlayerLanguage | null = null,
): Player {
  return {
    avatar: null,
    createdAt: nowIso,
    family: null,
    id,
    language,
    loadout,
    name,
    nameKey: playerNameKey(name),
    narrative: createEmptyNarrative(),
    prison: null,
    progression: {
      experience: 0,
      level: 1,
      skillExperience: createEmptySkillExperience(),
      skillPoints: 0,
      skills: createSkillRecord(STARTING_SKILL_LEVEL),
    },
    rank: "nobody",
    reservedEquipment: null,
    resources: {
      cash: 0,
      drunk: 0,
      health: MAX_HEALTH,
      heat: 0,
      high: 0,
      power: 2,
      stamina: MAX_STAMINA,
    },
    stash: [],
    updatedAt: nowIso,
    war: createEmptyWar(),
  };
}

const HEALING_BY_ITEM_ID: Readonly<Record<string, number>> = {
  "black-market-trauma-kit": 100,
  "field-surgeon-kit": 50,
  "first-aid-tin": 25,
};

const RETIRED_EQUIPMENT_IDS = new Set([
  "armor-piercing-rounds",
  "buckshot-shells",
  "incendiary-rounds",
  "match-grade-rounds",
  "steel-core-rounds",
  "tranquilizer-darts",
]);

const STASH_TOOL_IDS = new Set([
  "black-market-trauma-kit",
  "bolt-cutters",
  "climbing-rope",
  "crowbar",
  "disguise-kit",
  "field-surgeon-kit",
  "first-aid-tin",
  "getaway-car-keys",
  "lockpick-set",
  "radio-scanner",
  "safecracker-drill",
  "signal-jammer",
  "wiretap-kit",
]);

const WAIST_ARMOR_BY_ITEM_ID: Readonly<Record<string, number>> = {
  "ammo-bandolier": 12,
  "canvas-tool-belt": 4,
  "extended-magazine-rig": 17,
  "kingpin-gun-belt": 27,
  "leather-holster": 2,
  "radio-scanner-belt": 21,
  "shoulder-holster-rig": 8,
};

/**
 * Fills fields that predate them on stored player docs and migrates retired
 * skills and equipment mechanics without blocking an existing save.
 */
export function normalizePlayer(player: Player): Player {
  return {
    ...player,
    // Families founded before names existed inherit the player's name.
    family: player.family
      ? {
          ...player.family,
          name: player.family.name ?? player.name,
          nameKey:
            player.family.nameKey ??
            playerNameKey(player.family.name ?? player.name),
        }
      : null,
    language: player.language ?? null,
    narrative: player.narrative ?? createEmptyNarrative(),
    prison: player.prison ?? null,
    progression: {
      ...player.progression,
      skillExperience: normalizeSkillRecord(
        player.progression.skillExperience,
        0,
      ),
      skills: normalizeSkillRecord(
        player.progression.skills,
        STARTING_SKILL_LEVEL,
      ),
    },
    resources: {
      cash: player.resources.cash,
      drunk: player.resources.drunk ?? 0,
      health: Math.min(
        MAX_HEALTH,
        Math.max(MIN_HEALTH, player.resources.health ?? MAX_HEALTH),
      ),
      heat: player.resources.heat ?? 0,
      high: player.resources.high ?? 0,
      power: player.resources.power,
      stamina: player.resources.stamina ?? MAX_STAMINA,
    },
    loadout: Object.fromEntries(
      Object.entries(player.loadout ?? {}).map(([slot, item]) => [
        slot,
        normalizePlayerItem(item),
      ]),
    ),
    reservedEquipment: player.reservedEquipment ?? null,
    stash: normalizeStash(player.stash ?? []),
    war: player.war ?? createEmptyWar(),
  };
}

function normalizeStash(stash: PlayerItem[]): PlayerItem[] {
  const normalized: PlayerItem[] = [];
  const consumableIndexes = new Map<string, number>();

  for (const storedItem of stash) {
    if (RETIRED_EQUIPMENT_IDS.has(storedItem.id)) {
      continue;
    }

    const item = normalizePlayerItem(storedItem, true);
    if (!item.consumable) {
      normalized.push(item);
      continue;
    }

    const existingIndex = consumableIndexes.get(item.id);
    if (existingIndex === undefined) {
      consumableIndexes.set(item.id, normalized.length);
      normalized.push({
        ...item,
        quantity: normalizeItemQuantity(item.quantity),
      });
      continue;
    }

    const existing = normalized[existingIndex]!;
    const existingQuantity = normalizeItemQuantity(existing.quantity);
    const itemQuantity = normalizeItemQuantity(item.quantity);
    normalized[existingIndex] = {
      ...existing,
      ...item,
      quantity:
        existingQuantity > Number.MAX_SAFE_INTEGER - itemQuantity
          ? Number.MAX_SAFE_INTEGER
          : existingQuantity + itemQuantity,
    };
  }

  return normalized;
}

function normalizeItemQuantity(quantity: number | undefined): number {
  return typeof quantity === "number" &&
    Number.isSafeInteger(quantity) &&
    quantity > 0
    ? quantity
    : 1;
}

function normalizePlayerItem(item: PlayerItem, fromStash = false): PlayerItem {
  const normalized = { ...item };
  const healing = HEALING_BY_ITEM_ID[item.id];
  const waistArmor = WAIST_ARMOR_BY_ITEM_ID[item.id];

  if ((normalized.slot as EquipmentSlotId | null | undefined) === null) {
    delete normalized.slot;
  }
  if (
    fromStash &&
    (STASH_TOOL_IDS.has(item.id) ||
      (item.category === "tool" && !item.slot))
  ) {
    normalized.consumable = true;
  }
  if (healing !== undefined) {
    normalized.use = { ...normalized.use, health: healing };
    delete normalized.tags;
  }
  if (waistArmor !== undefined) {
    normalized.armor = waistArmor;
  }
  if (normalized.slot === "hand") {
    delete normalized.armor;
    delete normalized.consumable;
    delete normalized.effects;
    delete normalized.tags;
    delete normalized.use;
  }

  return normalized;
}

/**
 * Backfills any skill the stored doc predates with `fallback`, so adding
 * a skill to the registry migrates every player automatically. The
 * retired `business` skill folds into tech.
 */
function normalizeSkillRecord(
  stored: Partial<Record<SkillId, number>> | undefined,
  fallback: number,
): Record<SkillId, number> {
  const legacy = (stored ?? {}) as Partial<Record<SkillId, number>> & {
    business?: number;
  };
  const record = createSkillRecord(fallback);

  for (const id of SKILL_IDS) {
    record[id] = legacy[id] ?? fallback;
  }
  record.tech = legacy.tech ?? legacy.business ?? fallback;

  return record;
}
