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
