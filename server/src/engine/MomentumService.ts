import { EngineConfig } from "../../../shared/engineConfig";
import { intoxicationPenalty } from "../../../shared/intoxication";
import {
  CheckModifierBreakdown,
  CheckRoll,
  JobApproach,
  OutcomeTier,
} from "../../../shared/job";
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
    consumablePower = 0,
  ): number {
    return this.checkBreakdown(
      context,
      skill,
      approach,
      checkDifficulty,
      engine,
      consumablePower,
    ).finalChance;
  }

  static checkBreakdown(
    context: EnginePlayerContext,
    skill: keyof PlayerSkills,
    approach: JobApproach,
    checkDifficulty: number,
    engine: EngineConfig,
    consumablePower = 0,
  ): CheckModifierBreakdown {
    const c = engine.checks;
    const skillLevel = context.skills[skill];
    const equipmentSkillLevel = context.bonuses.skillBonus[skill] ?? 0;
    const approachBonus = context.bonuses.approachBonus[approach] ?? 0;
    const skillChance = c.perSkillPoint * skillLevel;
    const equipmentSkillBonus = c.perSkillPoint * equipmentSkillLevel;
    const difficultyModifier = c.perDifficulty * checkDifficulty;
    const characterPowerBonus = Math.floor(
      context.characterPower / c.powerDivisor,
    );
    const normalPowerBonus = Math.floor(
      context.effectivePower / c.powerDivisor,
    );
    const equipmentPowerBonus = normalPowerBonus - characterPowerBonus;
    const withConsumableBonus = Math.floor(
      (context.effectivePower + consumablePower) / c.powerDivisor,
    );
    const consumablePowerBonus = withConsumableBonus - normalPowerBonus;
    const heatPenalty = Math.floor(context.heat / c.heatChanceDivisor);
    const impairment = intoxicationPenalty(context.high, context.drunk);
    const unclampedChance =
      c.baseChance +
      skillChance +
      equipmentSkillBonus +
      difficultyModifier +
      characterPowerBonus +
      equipmentPowerBonus +
      consumablePowerBonus -
      heatPenalty -
      impairment +
      approachBonus;
    const finalChance = clamp(
      Math.round(unclampedChance),
      c.minChance,
      c.maxChance,
    );

    return {
      approachBonus,
      baseChance: c.baseChance,
      characterPower: context.characterPower,
      characterPowerBonus,
      consumablePower,
      consumablePowerBonus,
      difficultyModifier,
      equipmentPower: context.equipmentPower,
      equipmentPowerBonus,
      equipmentSkillBonus,
      finalAdjustment: finalChance - unclampedChance,
      finalChance,
      heatPenalty,
      intoxicationPenalty: impairment,
      powerDivisor: c.powerDivisor,
      skillChance,
      skillLevel,
      unclampedChance,
    };
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
