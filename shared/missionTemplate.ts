import { z } from "zod";
import { OUTCOME_TIERS } from "./job";

/**
 * Per-tier reward knobs.
 *   cash = roundToFive(cashFactor × offer.rewardMax)
 *   heat = ceil(heatFactor × offer.heatIncrease) + heatBonus
 *   xp   = round(xpFactor × offer.difficulty × rewards.xpPerDifficulty)
 */
const outcomeRewardSchema = z
  .object({
    cashFactor: z.number().min(0),
    heatBonus: z.number().min(0),
    heatFactor: z.number().min(0),
    xpFactor: z.number().min(0),
  })
  .strict();

/**
 * A mission template as authored in server/missions/*.yml — every balance
 * knob a mission needs lives here, not in code.
 */
export const missionTemplateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    district: z.string().min(1),
    /** Choices per run; the tree doubles per level, so 3-5. */
    depth: z.number().int().min(3).max(5),
    difficulty: z
      .object({
        base: z.number(),
        perPowerTier: z.number(),
        perRankTier: z.number(),
      })
      .strict(),
    rewards: z
      .object({
        cashBase: z.number().min(0),
        cashPerPowerTier: z.number().min(0),
        cashPerRankTier: z.number().min(0),
        spreadBase: z.number().min(0),
        spreadPerPowerTier: z.number().min(0),
        spreadPerRankTier: z.number().min(0),
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
  .strict();

export type MissionTemplate = z.infer<typeof missionTemplateSchema>;
export type OutcomeReward = z.infer<typeof outcomeRewardSchema>;
export type SkillExperienceSettings = MissionTemplate["skillExperience"];
