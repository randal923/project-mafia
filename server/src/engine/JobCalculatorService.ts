import { EngineConfig } from "../../../shared/engineConfig";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { clamp, roundToFive } from "./math";
import { EnginePlayerContext } from "./PlayerContextService";

export type JobCalculations = {
  difficulty: number;
  heatIncrease: number;
  /** Raises per-edge check difficulty as the player's heat climbs. */
  heatPressure: number;
  rewardMax: number;
  rewardMin: number;
};

/**
 * Turns a mission template's knobs plus the player's situation into the
 * offer numbers. All tuning lives in server/missions/*.yml. Difficulty is
 * on the 1-100 scale, anchored at the template's level band: playing past
 * the band's floor stretches the job harder via difficulty.perLevel.
 */
export class JobCalculatorService {
  static calculate(
    context: EnginePlayerContext,
    template: MissionTemplate,
    engine: EngineConfig,
  ): JobCalculations {
    const { difficulty: d, heat, rewards } = template;
    const levelsIntoBand = Math.max(0, context.level - template.levels.min);
    const difficulty = clamp(
      Math.round(d.base + d.perLevel * levelsIntoBand),
      1,
      100,
    );
    const rewardMin = roundToFive(
      rewards.cashBase + rewards.cashPerLevel * context.level,
    );
    const rewardMax =
      rewardMin +
      roundToFive(rewards.spreadBase + rewards.spreadPerLevel * context.level);

    return {
      difficulty,
      heatIncrease: clamp(
        heat.base + Math.floor(difficulty * heat.perDifficulty),
        1,
        heat.max,
      ),
      heatPressure: Math.floor(
        context.heat / engine.checks.heatPressureDivisor,
      ),
      rewardMax,
      rewardMin,
    };
  }
}
