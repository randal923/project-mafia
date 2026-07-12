import { z } from "zod";
import { JOB_APPROACHES } from "./job";

/** Momentum swing of one stakes level: what a pass or fail is worth. */
const momentumStakesSchema = z
  .object({
    pass: z.number().min(0),
    fail: z.number().max(0),
  })
  .strict();

/**
 * What playing an approach costs beyond the roll itself. Cash is paid up
 * front when the choice is taken (win or lose); heat lands only when the
 * check fails and the move goes loud.
 */
const approachCostSchema = z
  .object({
    /** Upfront cash cost as a fraction of the offer's rewardMax. */
    cashCostFactor: z.number().min(0).max(1).optional(),
    /** Heat gained on this edge when its check fails. */
    heatOnFail: z.number().min(0).optional(),
  })
  .strict();

/**
 * Global engine constants, loaded from server/missions/_engine.yml.
 * These define what a skill point, a critical, or a momentum point MEANS
 * across the whole game — per-mission personality belongs in the mission
 * template files instead. Skills, levels and check difficulties all live
 * on a 1-100 scale.
 */
export const engineConfigSchema = z
  .object({
    board: z
      .object({
        /** Offers on the job board. */
        size: z.number().int().min(1).max(6),
        /** A template stays offerable until playerLevel > levels.max + this. */
        levelGrace: z.number().int().min(0),
      })
      .strict(),
    checks: z
      .object({
        baseChance: z.number(),
        perSkillPoint: z.number(),
        /** Usually negative — harder checks lower the chance. */
        perDifficulty: z.number(),
        /** +1% chance per this much effective power. */
        powerDivisor: z.number().min(1),
        /** −1% chance per this much player heat. */
        heatChanceDivisor: z.number().min(1),
        minChance: z.number().min(0).max(100),
        maxChance: z.number().min(0).max(100),
        /** Beating/missing the chance by this margin is a critical. */
        criticalMargin: z.number().min(0),
        /** Check difficulty added per beat into the mission. */
        perBeatDepth: z.number().min(0),
        /** ± applied to a beat's safer/bolder choice pair. */
        saferBolderGap: z.number().min(0),
        /** +1 check difficulty per this much player heat. */
        heatPressureDivisor: z.number().min(1),
      })
      .strict(),
    gear: z
      .object({
        /** Check difficulty removed when required gear is carried. */
        satisfiedBonus: z.number().min(0),
      })
      .strict(),
    momentum: z
      .object({
        /** Low swing: the cautious option on every beat. */
        safer: momentumStakesSchema,
        /** High swing: the bold option. Bigger pass, uglier fail. */
        bolder: momentumStakesSchema,
        criticalBonus: z.number().min(0),
      })
      .strict(),
    /** Per-approach edge costs; every approach must be listed. */
    approaches: z
      .object(
        Object.fromEntries(
          JOB_APPROACHES.map((approach) => [approach, approachCostSchema]),
        ) as Record<
          (typeof JOB_APPROACHES)[number],
          typeof approachCostSchema
        >,
      )
      .strict(),
    stamina: z
      .object({
        /**
         * Accepting a job costs
         * round(baseCost + costPerDepth × (depth − 3) + perDifficulty × difficulty)
         * — harder, deeper jobs burn more energy.
         */
        baseCost: z.number().min(0),
        costPerDepth: z.number().min(0),
        perDifficulty: z.number().min(0),
      })
      .strict(),
    prison: z
      .object({
        /** Sentence length; 1 game day = 1 real hour (shared/gameTime.ts). */
        sentenceGameDays: z.number().min(0.1),
        /** Bribing a guard: cost = base + perLevel × level. */
        bribeBaseCost: z.number().min(0),
        bribeCostPerLevel: z.number().min(0),
        /** chance = clamp(base + perCharisma × charisma, min, max) */
        bribeBaseChance: z.number(),
        bribePerCharisma: z.number(),
        /** chance = clamp(base + perStealth × stealth, min, max) */
        escapeBaseChance: z.number(),
        escapePerStealth: z.number(),
        minChance: z.number().min(0).max(100),
        maxChance: z.number().min(0).max(100),
        /** Failed escape adds this many real minutes to the sentence. */
        escapeFailExtensionMinutes: z.number().min(0),
        /** Breaking out marks you: heat gained on a successful escape. */
        escapeHeat: z.number().min(0),
        /** Doing the full time cools you off: heat removed on release. */
        serveHeatRelief: z.number().min(0),
        /** Real minutes between bribe/escape attempts. */
        attemptCooldownMinutes: z.number().min(0),
      })
      .strict(),
    precinct: z
      .object({
        /** Heat removed per payment. */
        chunk: z.number().min(1),
        /** cost = (base + perLevel × level) × (1 − corruption discount) */
        baseCost: z.number().min(0),
        costPerLevel: z.number().min(0),
        discountPerCorruption: z.number().min(0),
        maxDiscount: z.number().min(0).max(0.9),
      })
      .strict(),
  })
  .strict();

export type EngineConfig = z.infer<typeof engineConfigSchema>;
export type MomentumStakesConfig = z.infer<typeof momentumStakesSchema>;
export type ApproachCostConfig = z.infer<typeof approachCostSchema>;
