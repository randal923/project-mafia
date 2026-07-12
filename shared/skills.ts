/**
 * The single registry of player skills. Adding a skill is ONE entry here
 * (plus, if it should be rollable on jobs, one approach entry in job.ts):
 * player records, zod schemas, migrations, and the client UI all iterate
 * this list.
 */
export const SKILL_IDS = [
  "charisma",
  "corruption",
  "leadership",
  "muscle",
  "stealth",
  "strategy",
  "tech",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export type SkillDefinition = {
  /** Tooltip copy: what the skill is and where it gets rolled. */
  description: string;
  label: string;
};

export const SKILLS: Record<SkillId, SkillDefinition> = {
  charisma: {
    description:
      "Raw personal magnetism. Rolled by charm choices on jobs, and it's what sways a prison guard when you try to bribe your way out of a cell. +1% check chance per level.",
    label: "Charisma",
  },
  corruption: {
    description:
      "Knowing who takes envelopes and how thick they need to be. Rolled by deception choices on jobs, and every level shaves the price of paying off the precinct to lower your heat.",
    label: "Corruption",
  },
  leadership: {
    description:
      "Running a crew and working a room. Rolled by social choices on jobs — rallying accomplices, leaning on witnesses, commanding respect. +1% check chance per level.",
    label: "Leadership",
  },
  muscle: {
    description:
      "Hitting hard and holding your ground. Rolled by force choices on jobs. Equipped power helps every approach, while armor absorbs Health damage after risky failures. +1% check chance per level.",
    label: "Muscle",
  },
  stealth: {
    description:
      "Moving unseen and leaving no trace. Rolled by quiet choices on jobs, and it's what carries a prison break attempt. +1% check chance per level.",
    label: "Stealth",
  },
  strategy: {
    description:
      "Reading a situation and striking when the gap opens. Rolled by opportunistic choices on jobs. +1% check chance per level.",
    label: "Strategy",
  },
  tech: {
    description:
      "Locks, wires, alarms, and explosives — the technical trades. Rolled by technical choices on jobs. +1% check chance per level.",
    label: "Tech",
  },
};

/** Every skill starts at this level on a new character. */
export const STARTING_SKILL_LEVEL = 1;

export function createSkillRecord(value: number): Record<SkillId, number> {
  return Object.fromEntries(SKILL_IDS.map((id) => [id, value])) as Record<
    SkillId,
    number
  >;
}
