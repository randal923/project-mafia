import { EngineConfig } from "../../../../shared/engineConfig";
import { MissionTemplate } from "../../../../shared/missionTemplate";

/**
 * Stable engine-config fixture mirroring _engine.yml defaults at the time
 * the tests were written — tuning the yml must NOT break engine tests.
 */
export const TEST_ENGINE: EngineConfig = {
  board: { size: 4, levelGrace: 15 },
  checks: {
    baseChance: 52,
    perSkillPoint: 1.0,
    perDifficulty: -0.9,
    powerDivisor: 25,
    heatChanceDivisor: 20,
    minChance: 5,
    maxChance: 95,
    criticalMargin: 40,
    perBeatDepth: 2,
    saferBolderGap: 5,
    heatPressureDivisor: 5,
  },
  gear: { missingPenalty: 15, satisfiedBonus: 5 },
  momentum: { pass: 2, fail: -2, criticalBonus: 1 },
  stamina: { baseCost: 8, costPerDepth: 4, perDifficulty: 0.18 },
  prison: {
    sentenceGameDays: 1,
    bribeBaseCost: 300,
    bribeCostPerLevel: 90,
    bribeBaseChance: 30,
    bribePerCharisma: 0.6,
    escapeBaseChance: 25,
    escapePerStealth: 0.6,
    minChance: 5,
    maxChance: 90,
    escapeFailExtensionMinutes: 30,
    escapeHeat: 15,
    serveHeatRelief: 30,
    attemptCooldownMinutes: 10,
  },
  precinct: {
    chunk: 20,
    baseCost: 250,
    costPerLevel: 45,
    discountPerCorruption: 0.004,
    maxDiscount: 0.4,
  },
};

/**
 * Stable template fixture for golden engine tests — content edits to the
 * shipped yml files must NOT break engine math tests.
 */
export const TEST_TEMPLATE: MissionTemplate = {
  id: "test-robbery",
  name: "Test Robbery",
  type: "robbery",
  district: "Docks",
  levels: { min: 1, max: 10 },
  depth: 3,
  difficulty: { base: 2, perLevel: 1 },
  rewards: {
    cashBase: 20,
    cashPerLevel: 50,
    spreadBase: 10,
    spreadPerLevel: 15,
    xpBase: 30,
    xpPerDifficulty: 6,
  },
  heat: { base: 1, max: 12, perDifficulty: 0.1 },
  skillExperience: {
    basePerSuccess: 30,
    criticalMultiplier: 2,
    perCheckDifficulty: 0.05,
  },
  healthRisk: { approaches: ["force"] },
  outcomes: {
    jackpot: { cashFactor: 1.5, heatBonus: 0, heatFactor: 1, xpFactor: 2 },
    successful: { cashFactor: 1, heatBonus: 0, heatFactor: 0.5, xpFactor: 1.5 },
    partially_successful: {
      cashFactor: 0.8,
      heatBonus: 0,
      heatFactor: 1,
      xpFactor: 1,
    },
    partial_failure: {
      cashFactor: 0.25,
      heatBonus: 2,
      heatFactor: 1,
      xpFactor: 0.5,
    },
    failure: { cashFactor: 0, heatBonus: 4, heatFactor: 1, xpFactor: 0.25 },
    disaster: { cashFactor: 0, heatBonus: 8, heatFactor: 1, xpFactor: 0.1 },
  },
  storySeeds: [
    {
      location: "Pier 9 bonded warehouse",
      premise: "A clerk sells you the location of a cage of untaxed cigarettes.",
      pressure: "The customs inspection happens at dawn.",
    },
    {
      location: "The trawler 'Santa Lucia'",
      premise: "Gambling cash is hidden under the ice in the hold.",
      pressure: "The crew stumbles back from the bar at random.",
    },
    {
      location: "Harbor master's office",
      premise: "A week of bribe envelopes sits in an old floor safe.",
      pressure: "A patrol loops past every twenty minutes.",
    },
    {
      location: "Dockside pawn shop",
      premise: "A tray of stolen watches is too hot for the broker to move.",
      pressure: "He sleeps above the shop with a shotgun.",
    },
  ],
};

/**
 * Same template but every edge demands gear (chance 1), for exercising
 * the gear-aware skeleton deterministically.
 */
export const TEST_TEMPLATE_WITH_GEAR: MissionTemplate = {
  ...TEST_TEMPLATE,
  id: "test-robbery-gear",
  gear: [
    {
      approaches: [
        "charm",
        "deception",
        "force",
        "opportunistic",
        "quiet",
        "social",
        "technical",
      ],
      chance: 1,
      consumes: true,
      label: "Flashbang",
      tags: ["flashbang"],
    },
  ],
};
