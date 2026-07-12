import type { EquipmentSlotId, PlayerItem, PlayerRank } from "./player";
import type { PlayerLanguage } from "./language";
import { normalizeEquipmentImage } from "./normalizeEquipmentImage";
import type { SkillId } from "./skills";

/**
 * The single registry of crew archetypes. Each archetype maps 1:1 to a
 * player skill: on jobs the member boosts checks of that skill, and in a
 * building a matching archetype staffs it at full effectiveness.
 */
export const CREW_ARCHETYPE_IDS = [
  "enforcer",
  "face",
  "fixer",
  "ghost",
  "mastermind",
  "underboss",
  "wirehead",
] as const;

export type CrewArchetypeId = (typeof CREW_ARCHETYPE_IDS)[number];

export type CrewArchetypeDefinition = {
  description: string;
  label: string;
  skill: SkillId;
};

export const CREW_ARCHETYPES: Record<CrewArchetypeId, CrewArchetypeDefinition> =
  {
    enforcer: {
      description:
        "Hits hard and stands his ground. Boosts force checks on jobs and holds turf like a wall.",
      label: "Enforcer",
      skill: "muscle",
    },
    face: {
      description:
        "Charms rooms and marks alike. Boosts charm checks and keeps club floors full.",
      label: "Face",
      skill: "charisma",
    },
    fixer: {
      description:
        "Knows who takes envelopes. Boosts deception checks and keeps the law looking away.",
      label: "Fixer",
      skill: "corruption",
    },
    ghost: {
      description:
        "Comes and goes unseen. Boosts quiet checks and moves product without a ripple.",
      label: "Ghost",
      skill: "stealth",
    },
    mastermind: {
      description:
        "Reads the angles before anyone else. Boosts opportunistic checks and runs the numbers.",
      label: "Mastermind",
      skill: "strategy",
    },
    underboss: {
      description:
        "Runs crews so you don't have to. Boosts social checks and keeps soldiers in line.",
      label: "Underboss",
      skill: "leadership",
    },
    wirehead: {
      description:
        "Locks, wires, and rigged tables. Boosts technical checks and keeps the machines paying.",
      label: "Wirehead",
      skill: "tech",
    },
  };

/** Tier 1..5. Higher tiers hit harder, cost more, and are rarer to find. */
export const CREW_TIERS = [1, 2, 3, 4, 5] as const;

export type CrewTier = (typeof CREW_TIERS)[number];

export const CREW_TIER_LABELS: Record<CrewTier, string> = {
  1: "Associate",
  2: "Soldier",
  3: "Veteran",
  4: "Capo",
  5: "Legend",
};

/** Base muscle a member brings before gear, by tier. */
export const CREW_TIER_BASE_POWER: Record<CrewTier, number> = {
  1: 2,
  2: 4,
  3: 7,
  4: 11,
  5: 16,
};

/** Wage multiplier by tier — legends do not work for associate pay. */
export const CREW_TIER_WAGE_FACTOR: Record<CrewTier, number> = {
  1: 1,
  2: 1.5,
  3: 2.25,
  4: 3.5,
  5: 5,
};

/**
 * Traits color a member's numbers. Kept as a typed-modifier registry so
 * services never switch on trait ids — they sum the modifiers.
 */
export const CREW_TRAIT_IDS = [
  "connected",
  "coward",
  "discreet",
  "greedy",
  "hothead",
  "loyal_dog",
  "veteran_instincts",
  "workhorse",
] as const;

export type CrewTraitId = (typeof CREW_TRAIT_IDS)[number];

export type CrewTraitModifiers = {
  /** Delta to the job check bonus this member grants. */
  checkBonus?: number;
  /** Never dies on a disaster — flees instead (still loses the job). */
  fleesDeath?: boolean;
  /** Extra heat when a job this member is on ends in disaster. */
  heatOnDisaster?: number;
  /** Multiplier on hiring cost. */
  hireCostFactor?: number;
  /** Multiplier on income when staffing a building. */
  incomeFactor?: number;
  /** Multiplier on loyalty lost while wages go unpaid. */
  loyaltyDecayFactor?: number;
  /** Flat power delta. */
  power?: number;
  /** Multiplier on wage. */
  wageFactor?: number;
};

export type CrewTraitDefinition = {
  description: string;
  label: string;
  modifiers: CrewTraitModifiers;
};

export const CREW_TRAITS: Record<CrewTraitId, CrewTraitDefinition> = {
  connected: {
    description: "Comes recommended — hiring him costs less up front.",
    label: "Connected",
    modifiers: { hireCostFactor: 0.7 },
  },
  coward: {
    description:
      "First out the door when it goes wrong. Weaker on jobs, but never dies — he runs.",
    label: "Coward",
    modifiers: { checkBonus: -1, fleesDeath: true },
  },
  discreet: {
    description: "Leaves no trace. Disasters with him aboard draw less heat.",
    label: "Discreet",
    modifiers: { heatOnDisaster: -4 },
  },
  greedy: {
    description:
      "Skims everything he touches — costs more, but squeezes buildings harder.",
    label: "Greedy",
    modifiers: { incomeFactor: 1.15, wageFactor: 1.3 },
  },
  hothead: {
    description:
      "Swings first. Extra power, but disasters with him aboard run louder.",
    label: "Hothead",
    modifiers: { heatOnDisaster: 4, power: 2 },
  },
  loyal_dog: {
    description: "Stays when the money stops. Loyalty bleeds half as fast.",
    label: "Loyal Dog",
    modifiers: { loyaltyDecayFactor: 0.5 },
  },
  veteran_instincts: {
    description: "Seen everything twice. A little sharper on every check.",
    label: "Veteran Instincts",
    modifiers: { checkBonus: 1 },
  },
  workhorse: {
    description: "Never clocks out. Buildings he staffs simply produce more.",
    label: "Workhorse",
    modifiers: { incomeFactor: 1.25, wageFactor: 1.1 },
  },
};

export const CREW_STATUSES = [
  "assigned_building",
  "assigned_turf",
  "dead",
  "idle",
  "imprisoned",
  "injured",
  "on_job",
  "training",
] as const;

export type CrewStatus = (typeof CREW_STATUSES)[number];

/** Crew wear a deliberately small loadout: weapon, vest, belt. */
export const CREW_SLOT_IDS = ["hand", "torso", "waist"] as const;

export type CrewSlotId = (typeof CREW_SLOT_IDS)[number];

export type CrewLoadout = Partial<Record<CrewSlotId, PlayerItem>>;

export function isCrewSlot(slot: EquipmentSlotId): slot is CrewSlotId {
  return (CREW_SLOT_IDS as readonly string[]).includes(slot);
}

/** Stored at players/{uid}/crew/{id}. */
export type CrewMember = {
  archetype: CrewArchetypeId;
  /** One-line backstory, LLM-written at hire time. */
  bio: string;
  /** Locale used to author `bio`; absent legacy records are English. */
  bioLanguage?: PlayerLanguage;
  createdAt: string;
  /** Set while status is imprisoned: gear held by the precinct. A bribe
   * release returns it; walking out on time served forfeits it. */
  confiscatedLoadout: CrewLoadout | null;
  id: string;
  loadout: CrewLoadout;
  loyalty: number;
  /** Which building/turf/mission the member is committed to, by status. */
  assignment: string | null;
  name: string;
  /** Free at this time when injured/imprisoned/training; null otherwise. */
  busyUntil: string | null;
  skillLevel: number;
  status: CrewStatus;
  tier: CrewTier;
  traits: CrewTraitId[];
  /** Set when a wage tick could not be paid in full. */
  unpaidSince: string | null;
  updatedAt: string;
  /** Wage clock: pay accrues per whole game day since this instant. */
  wagesSettledAt: string;
};

/** A hireable prospect on the daily recruitment pool. */
export type CrewCandidate = {
  archetype: CrewArchetypeId;
  bio: string;
  bioLanguage?: PlayerLanguage;
  hireCost: number;
  id: string;
  name: string;
  skillLevel: number;
  tier: CrewTier;
  traits: CrewTraitId[];
  wage: number;
};

export type CrewRecruitmentPool = {
  candidates: CrewCandidate[];
  generatedAt: string;
  /** Invalidates the pool after the player changes language. */
  language?: PlayerLanguage;
};

export const MAX_CREW_SKILL_LEVEL = 100;
export const STARTING_CREW_LOYALTY = 60;
export const MAX_CREW_LOYALTY = 100;

/** Roster cap climbs the rank ladder. */
export const CREW_ROSTER_CAP_BY_RANK: Record<PlayerRank, number> = {
  city_kingpin: 20,
  crew_leader: 5,
  crime_lord: 15,
  district_boss: 11,
  local_boss: 8,
  nobody: 0,
  street_hustler: 2,
};

/** The rank at which hiring unlocks. */
export const CREW_UNLOCK_RANK: PlayerRank = "street_hustler";

export function crewTraitModifiers(traits: CrewTraitId[]): CrewTraitModifiers {
  const summed: CrewTraitModifiers = {};
  for (const id of traits) {
    const m = CREW_TRAITS[id].modifiers;
    if (m.checkBonus) summed.checkBonus = (summed.checkBonus ?? 0) + m.checkBonus;
    if (m.fleesDeath) summed.fleesDeath = true;
    if (m.heatOnDisaster)
      summed.heatOnDisaster = (summed.heatOnDisaster ?? 0) + m.heatOnDisaster;
    if (m.hireCostFactor)
      summed.hireCostFactor = (summed.hireCostFactor ?? 1) * m.hireCostFactor;
    if (m.incomeFactor)
      summed.incomeFactor = (summed.incomeFactor ?? 1) * m.incomeFactor;
    if (m.loyaltyDecayFactor)
      summed.loyaltyDecayFactor =
        (summed.loyaltyDecayFactor ?? 1) * m.loyaltyDecayFactor;
    if (m.power) summed.power = (summed.power ?? 0) + m.power;
    if (m.wageFactor)
      summed.wageFactor = (summed.wageFactor ?? 1) * m.wageFactor;
  }
  return summed;
}

/** Gear power an equipped crew loadout contributes. */
export function crewLoadoutPower(loadout: CrewLoadout): number {
  return Object.values(loadout).reduce(
    (sum, item) => sum + (item?.power ?? 0),
    0,
  );
}

/** Total fighting weight: tier base + skill + traits + gear. */
export function crewMemberPower(
  member: Pick<CrewMember, "loadout" | "skillLevel" | "tier" | "traits">,
): number {
  return (
    CREW_TIER_BASE_POWER[member.tier] +
    Math.floor(member.skillLevel / 10) +
    (crewTraitModifiers(member.traits).power ?? 0) +
    crewLoadoutPower(member.loadout)
  );
}

/**
 * Wage per game day (= one real hour). Legends on high skill are a real
 * payroll line — arming and keeping a big roster is the endgame sink.
 */
export function crewWage(
  tier: CrewTier,
  skillLevel: number,
  traits: CrewTraitId[],
): number {
  const base = (8 + 2 * skillLevel) * CREW_TIER_WAGE_FACTOR[tier];
  const factor = crewTraitModifiers(traits).wageFactor ?? 1;
  return Math.max(5, Math.round((base * factor) / 5) * 5);
}

/** Up-front cost to put a candidate on the payroll. */
export function crewHireCost(
  tier: CrewTier,
  skillLevel: number,
  traits: CrewTraitId[],
): number {
  const factor = crewTraitModifiers(traits).hireCostFactor ?? 1;
  return Math.round((crewWage(tier, skillLevel, traits) * 15 * factor) / 5) * 5;
}

/**
 * Check bonus the member grants on jobs, to his archetype's skill only.
 * Enters the pass-chance formula as flat percentage points, exactly like
 * an equipment skillBonus.
 */
export function crewCheckBonus(
  member: Pick<CrewMember, "skillLevel" | "tier" | "traits">,
): number {
  return Math.max(
    0,
    2 * member.tier +
      Math.floor(member.skillLevel / 20) +
      (crewTraitModifiers(member.traits).checkBonus ?? 0),
  );
}

/** How many crew a player can bring on one job. Leadership runs the room. */
export function crewJobCapacity(leadershipSkill: number): number {
  return 1 + Math.floor(leadershipSkill / 25);
}

/** Loyalty lost per unpaid game day (= real hour), before traits. */
export const LOYALTY_LOSS_PER_UNPAID_DAY = 15;
/** Loyalty gained per fully paid game day, up to the cap. */
export const LOYALTY_GAIN_PER_PAID_DAY = 1;
/** At zero loyalty the member walks — with his gear. */
export const LOYALTY_DESERTION_THRESHOLD = 0;
/** Below this, an unpaid member may turn rat on the wage tick. */
export const LOYALTY_RAT_THRESHOLD = 10;
/** Heat spike when a member rats to the precinct on his way out. */
export const RAT_HEAT_SPIKE = 15;
/** Wage debt stops accruing past this many unpaid game days. */
export const MAX_UNPAID_WAGE_DAYS = 24;

/** Training: cash in, N real hours busy, skill out. */
export function crewTrainingCost(skillLevel: number): number {
  return Math.round((60 + 14 * skillLevel) / 5) * 5;
}

export const CREW_TRAINING_HOURS = 2;
export const CREW_TRAINING_SKILL_GAIN = 3;

/** Real hours on the shelf after a job injury, before healing perks. */
export const CREW_INJURY_RECOVERY_HOURS = 4;
/** Real hours in a cell when a job disaster takes a member down. */
export const CREW_PRISON_HOURS = 6;

/** Bribe price to spring an imprisoned member early, gear included. */
export function crewBribeCost(member: Pick<CrewMember, "skillLevel" | "tier" | "traits">): number {
  return crewWage(member.tier, member.skillLevel, member.traits) * 8;
}

/** Recruitment pool size and refresh cadence. */
export const RECRUITMENT_POOL_SIZE = 5;
export const RECRUITMENT_REFRESH_HOURS = 24;

/**
 * Candidate tier odds by player level: early boards are all associates;
 * legends only start appearing for established bosses.
 */
export function candidateTierWeights(playerLevel: number): Record<CrewTier, number> {
  return {
    1: Math.max(10, 60 - playerLevel),
    2: 20 + Math.min(20, playerLevel / 2),
    3: playerLevel >= 20 ? 10 + playerLevel / 4 : 0,
    4: playerLevel >= 40 ? 5 + playerLevel / 6 : 0,
    5: playerLevel >= 65 ? playerLevel / 8 : 0,
  };
}

/** Fills fields added after a member doc was written. */
export function normalizeCrewMember(member: CrewMember): CrewMember {
  return {
    ...member,
    assignment: member.assignment ?? null,
    busyUntil: member.busyUntil ?? null,
    bioLanguage: member.bioLanguage ?? "en",
    confiscatedLoadout: member.confiscatedLoadout
      ? Object.fromEntries(
          Object.entries(member.confiscatedLoadout).map(([slot, item]) => [
            slot,
            {
              ...item,
              ...(item.image && {
                image: normalizeEquipmentImage(item.image),
              }),
            },
          ]),
        )
      : null,
    loadout: Object.fromEntries(
      Object.entries(member.loadout ?? {}).map(([slot, item]) => [
        slot,
        {
          ...item,
          ...(item.image && { image: normalizeEquipmentImage(item.image) }),
        },
      ]),
    ),
    loyalty: Math.min(
      MAX_CREW_LOYALTY,
      Math.max(0, member.loyalty ?? STARTING_CREW_LOYALTY),
    ),
    traits: member.traits ?? [],
    unpaidSince: member.unpaidSince ?? null,
    wagesSettledAt: member.wagesSettledAt ?? member.createdAt,
  };
}
