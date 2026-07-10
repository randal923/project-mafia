import { EngineConfig } from "../../../shared/engineConfig";
import { CheckRoll, OutcomeTier } from "../../../shared/job";
import { clamp } from "./math";

/**
 * Check resolution and momentum math. All constants come from
 * server/missions/_engine.yml — tune there, not here.
 */
export class MomentumService {
  static passChance(
    skillValue: number,
    checkDifficulty: number,
    effectivePower: number,
    heat: number,
    engine: EngineConfig,
  ): number {
    const c = engine.checks;

    return clamp(
      c.baseChance +
        c.perSkillPoint * skillValue +
        c.perDifficulty * checkDifficulty +
        Math.floor(effectivePower / c.powerDivisor) -
        Math.floor(heat / c.heatChanceDivisor),
      c.minChance,
      c.maxChance,
    );
  }

  static resolveCheck(rollValue: number, chance: number): CheckRoll {
    return {
      margin: chance - rollValue,
      passChance: chance,
      passed: rollValue <= chance,
      value: rollValue,
    };
  }

  static isCritical(roll: CheckRoll, engine: EngineConfig): boolean {
    return Math.abs(roll.margin) >= engine.checks.criticalMargin;
  }

  static momentumDelta(roll: CheckRoll, engine: EngineConfig): number {
    const bonus = this.isCritical(roll, engine)
      ? engine.momentum.criticalBonus
      : 0;
    return roll.passed
      ? engine.momentum.pass + bonus
      : engine.momentum.fail - bonus;
  }

  /**
   * Maps a leaf's cumulative momentum to an outcome tier. Bands derive
   * from a "perfect run" (momentum.pass × depth), so they scale with both
   * depth and the configured momentum values: jackpot needs a perfect run
   * plus a critical, disaster needs a failed run with multiple criticals.
   */
  static tierForMomentum(
    momentum: number,
    depth: number,
    engine: EngineConfig,
  ): OutcomeTier {
    const perfect = engine.momentum.pass * depth;

    if (momentum > perfect) return "jackpot";
    if (momentum >= perfect - 1) return "successful";
    if (momentum >= 1) return "partially_successful";
    if (momentum >= -(perfect - 2)) return "partial_failure";
    if (momentum >= -(perfect + 1)) return "failure";
    return "disaster";
  }
}
