import { z } from "zod";
import { JOB_APPROACHES, OUTCOME_TIERS } from "./job";

/**
 * Per-tier reward knobs.
 *   cash = roundToFive(cashFactor × offer.rewardMax)
 *   heat = ceil(heatFactor × offer.heatIncrease) + heatBonus
 *   xp   = round(xpFactor × (rewards.xpBase + offer.difficulty × rewards.xpPerDifficulty))
 */
const outcomeRewardSchema = z
  .object({
    cashFactor: z.number().min(0),
    /** May be negative: lay-low jobs SHED heat on good outcomes. */
    heatBonus: z.number().min(-60),
    heatFactor: z.number().min(0),
    xpFactor: z.number().min(0),
  })
  .strict();

/**
 * Gear a mission may demand on some choices. Each entry can attach to
 * edges whose approach matches: with a matching item in the player's
 * loadout or stash the check gets a bonus (and a consumable is spent on
 * use); without one the player improvises and the check gets harder.
 */
const gearRequirementSchema = z
  .object({
    /** Edges with one of these approaches can roll this requirement. */
    approaches: z.array(z.enum(JOB_APPROACHES)).min(1),
    /** Probability an additional eligible edge demands the gear. */
    chance: z.number().min(0.01).max(1),
    /** Default spending behavior when no exact owned item overrides it. */
    consumes: z.boolean(),
    /** Display name, e.g. "Flashbang". */
    label: z.string().min(1),
    /** Any owned item carrying one of these tags satisfies it. */
    tags: z.array(z.string().min(1)).min(1),
  })
  .strict();

/**
 * A mission template as authored in server/missions/*.yml — every balance
 * knob a mission needs lives here, not in code. Difficulty, rewards and
 * XP are on a 1-100 scale anchored to the template's level band.
 */
export const missionTemplateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    district: z.string().min(1),
    /** Player level band this job is written for; the board matches on it. */
    levels: z
      .object({
        max: z.number().int().min(1).max(100),
        min: z.number().int().min(1).max(100),
      })
      .strict(),
    /** Choices per run; the tree doubles per level, so 3-5. */
    depth: z.number().int().min(3).max(5),
    /** Overrides the engine's depth-based stamina cost when set. */
    staminaCost: z.number().int().min(0).max(100).optional(),
    /** difficulty = clamp(round(base + perLevel × (playerLevel − levels.min)), 1, 100) */
    difficulty: z
      .object({
        base: z.number().min(1).max(100),
        perLevel: z.number(),
      })
      .strict(),
    rewards: z
      .object({
        cashBase: z.number().min(0),
        cashPerLevel: z.number().min(0),
        spreadBase: z.number().min(0),
        spreadPerLevel: z.number().min(0),
        xpBase: z.number().min(0),
        xpPerDifficulty: z.number().min(0),
      })
      .strict(),
    heat: z
      .object({
        base: z.number().min(0),
        max: z.number().min(1),
        perDifficulty: z.number().min(0),
      })
      .strict(),
    skillExperience: z
      .object({
        basePerSuccess: z.number().min(0),
        criticalMultiplier: z.number().min(1),
        perCheckDifficulty: z.number().min(0),
      })
      .strict(),
    /** Failed choices using one of these approaches can injure the player. */
    healthRisk: z
      .object({
        approaches: z.array(z.enum(JOB_APPROACHES)).min(1),
      })
      .strict(),
    gear: z.array(gearRequirementSchema).optional(),
    outcomes: z
      .object(
        Object.fromEntries(
          OUTCOME_TIERS.map((tier) => [tier, outcomeRewardSchema]),
        ) as Record<(typeof OUTCOME_TIERS)[number], typeof outcomeRewardSchema>,
      )
      .strict(),
    storySeeds: z
      .array(
        z
          .object({
            location: z.string().min(1),
            premise: z.string().min(1),
            pressure: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((template, context) => {
    if (template.levels.min > template.levels.max) {
      context.addIssue({
        code: "custom",
        message: "Mission minimum level cannot exceed its maximum level.",
        path: ["levels"],
      });
    }
    if (!template.healthRisk.approaches.includes("force")) {
      context.addIssue({
        code: "custom",
        message: "Every mission must make force choices a Health risk.",
        path: ["healthRisk", "approaches"],
      });
    }
    const beatNodeCapacity = 2 ** template.depth - 1;
    if ((template.gear?.length ?? 0) > beatNodeCapacity) {
      context.addIssue({
        code: "custom",
        message: `Mission gear cannot exceed its ${beatNodeCapacity} beat nodes.`,
        path: ["gear"],
      });
    }
  });

export type MissionTemplate = z.infer<typeof missionTemplateSchema>;
export type OutcomeReward = z.infer<typeof outcomeRewardSchema>;
export type GearRequirement = z.infer<typeof gearRequirementSchema>;
export type SkillExperienceSettings = MissionTemplate["skillExperience"];
