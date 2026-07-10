import { EngineConfig } from "../../../shared/engineConfig";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { clamp, roundToFive } from "./math";
import { EnginePlayerContext } from "./PlayerContextService";

export type JobCalculations = {
  difficulty: number;
  heatIncrease: number;
  /** Raises per-edge check difficulty as the player's heat climbs. */
  heatPressure: number;
  powerTier: number;
  rewardMax: number;
  rewardMin: number;
};

/**
 * Turns a mission template's knobs plus the player's situation into the
 * offer numbers. All tuning lives in server/missions/*.yml.
 */
export class JobCalculatorService {
  static calculate(
    context: EnginePlayerContext,
    template: MissionTemplate,
    engine: EngineConfig,
  ): JobCalculations {
    const { difficulty: d, heat, rewards } = template;
    const powerTier = Math.max(
      0,
      Math.floor(
        (context.effectivePower - engine.power.tierBase) /
          engine.power.tierStep,
      ),
    );
    const difficulty = clamp(
      d.base + d.perRankTier * context.rankTier + d.perPowerTier * powerTier,
      1,
      10,
    );
    const rewardMin = roundToFive(
      rewards.cashBase +
        rewards.cashPerRankTier * context.rankTier +
        rewards.cashPerPowerTier * powerTier,
    );
    const rewardMax = roundToFive(
      rewardMin +
        rewards.spreadBase +
        rewards.spreadPerRankTier * context.rankTier +
        rewards.spreadPerPowerTier * powerTier,
    );

    return {
      difficulty,
      heatIncrease: clamp(
        heat.base + Math.floor(difficulty * heat.perDifficulty),
        1,
        heat.max,
      ),
      heatPressure: Math.floor(context.heat / 25),
      powerTier,
      rewardMax,
      rewardMin,
    };
  }
}
