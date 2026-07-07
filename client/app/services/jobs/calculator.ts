import type {
  JobGenerationContext,
  RobberyJobCalculations,
} from "./types";

export class JobCalculatorService {
  static calculateRobbery(
    context: JobGenerationContext,
  ): RobberyJobCalculations {
    const powerTier = Math.max(
      0,
      Math.floor((context.effectivePower - 8) / 6),
    );
    const difficulty = clamp(1 + context.rankTier + powerTier, 1, 10);
    const rewardMin = roundToFive(20 + context.rankTier * 45 + powerTier * 25);
    const rewardMax = roundToFive(
      rewardMin + 10 + context.rankTier * 25 + powerTier * 15,
    );
    const heatPressure = Math.floor(context.heat / 25);

    return {
      difficulty,
      factionRespectChange: -Math.max(1, Math.ceil(difficulty / 2)),
      heatIncrease: clamp(1 + Math.floor(difficulty / 2), 1, 12),
      heatPressure,
      powerTier,
      requiredCrew: clamp(1 + Math.floor((difficulty - 1) / 2), 1, 12),
      rewardMax,
      rewardMin,
      risk: clamp(
        12 + context.rankTier * 7 + powerTier * 3 + heatPressure,
        8,
        90,
      ),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}
