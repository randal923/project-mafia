import { EngineConfig } from "../../../shared/engineConfig";
import { CheckRoll, JobApproach, OutcomeTier } from "../../../shared/job";
import { PlayerSkills } from "../../../shared/player";
import { clamp } from "./math";
import { EnginePlayerContext } from "./PlayerContextService";

/**
 * Check resolution and momentum math. All constants come from
 * server/missions/_engine.yml — tune there, not here.
 */
export class MomentumService {
  static passChance(
    context: EnginePlayerContext,
    skill: keyof PlayerSkills,
    approach: JobApproach,
    checkDifficulty: number,
    engine: EngineConfig,
  ): number {
    const c = engine.checks;
    const skillValue =
      context.skills[skill] + (context.bonuses.skillBonus[skill] ?? 0);
    const approachBonus = context.bonuses.approachBonus[approach] ?? 0;
    // Armor lets you weather things going loud, so it only aids force.
    const armorBonus =
      approach === "force"
        ? Math.floor(context.armor / engine.armor.forceChanceDivisor)
        : 0;

    return clamp(
      Math.round(
        c.baseChance +
          c.perSkillPoint * skillValue +
          c.perDifficulty * checkDifficulty +
          Math.floor(context.effectivePower / c.powerDivisor) -
          Math.floor(context.heat / c.heatChanceDivisor) +
          approachBonus +
          armorBonus,
      ),
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
