import { EngineConfig } from "../../../../shared/engineConfig";
import { MissionTemplate } from "../../../../shared/missionTemplate";

/**
 * Stable engine-config fixture mirroring _engine.yml defaults at the time
 * the tests were written — tuning the yml must NOT break engine tests.
 */
export const TEST_ENGINE: EngineConfig = {
  board: { size: 3 },
  power: { tierBase: 8, tierStep: 6 },
  checks: {
    baseChance: 50,
    perSkillPoint: 7,
    perDifficulty: -6,
    powerDivisor: 10,
    heatChanceDivisor: 20,
    minChance: 5,
    maxChance: 95,
    criticalMargin: 40,
    perBeatDepth: 1,
    saferBolderGap: 1,
    heatPressureDivisor: 25,
  },
  momentum: { pass: 2, fail: -2, criticalBonus: 1 },
};

/**
 * Stable template fixture for golden engine tests. Mirrors the shipped
 * docks-robbery.yml values at the time the tests were written — content
 * edits to the yml must NOT break engine math tests.
 */
export const TEST_TEMPLATE: MissionTemplate = {
  id: "test-robbery",
  name: "Test Robbery",
  type: "robbery",
  district: "Docks",
  depth: 3,
  difficulty: { base: 1, perPowerTier: 1, perRankTier: 1 },
  rewards: {
    cashBase: 20,
    cashPerPowerTier: 25,
    cashPerRankTier: 45,
    spreadBase: 10,
    spreadPerPowerTier: 15,
    spreadPerRankTier: 25,
    xpPerDifficulty: 10,
  },
  heat: { base: 1, max: 12, perDifficulty: 0.5 },
  skillExperience: {
    basePerSuccess: 2,
    criticalMultiplier: 2,
    perCheckDifficulty: 2,
  },
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
