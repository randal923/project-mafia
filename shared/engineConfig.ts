import { z } from "zod";

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
        /** Check difficulty added when required gear is missing. */
        missingPenalty: z.number().min(0),
        /** Check difficulty removed when required gear is carried. */
        satisfiedBonus: z.number().min(0),
      })
      .strict(),
    armor: z
      .object({
        /** +1% pass chance on force checks per this much loadout armor. */
        forceChanceDivisor: z.number().min(1),
        /** −1 mission heat per this much loadout armor (never below 1). */
        heatDivisor: z.number().min(1),
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
