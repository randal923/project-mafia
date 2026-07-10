import { z } from "zod";

/**
 * Global engine constants, loaded from server/missions/_engine.yml.
 * These define what a skill point, a critical, or a momentum point MEANS
 * across the whole game — per-mission personality belongs in the mission
 * template files instead.
 */
export const engineConfigSchema = z
  .object({
    board: z
      .object({
        /** Offers on the job board. */
        size: z.number().int().min(1).max(6),
      })
      .strict(),
    power: z
      .object({
        /** Power above tierBase counts toward power tiers... */
        tierBase: z.number(),
        /** ...one tier per tierStep power. */
        tierStep: z.number().min(1),
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
    momentum: z
      .object({
        pass: z.number(),
        fail: z.number(),
        criticalBonus: z.number().min(0),
      })
      .strict(),
  })
  .strict();

export type EngineConfig = z.infer<typeof engineConfigSchema>;
