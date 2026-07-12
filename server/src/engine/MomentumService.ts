import { EngineConfig } from "../../../shared/engineConfig";
import { intoxicationPenalty } from "../../../shared/intoxication";
import {
  CheckModifierBreakdown,
  CheckRoll,
  EdgeStakes,
  JobApproach,
  MomentumBands,
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

  static momentumDelta(
    roll: CheckRoll,
    stakes: EdgeStakes,
    engine: EngineConfig,
  ): number {
    const swing = engine.momentum[stakes];
    const bonus = this.isCritical(roll, engine)
      ? engine.momentum.criticalBonus
      : 0;
    return roll.passed ? swing.pass + bonus : swing.fail - bonus;
  }

  /**
   * Tier thresholds for a mission of this depth. A perfect safe run lands
   * exactly on "successful" — safe play never reaches jackpot — while the
   * bands past the safe perfect run (midline in either direction) are only
   * reachable by winning or losing bold plays.
   */
  static bands(depth: number, engine: EngineConfig): MomentumBands {
    const { safer, bolder } = engine.momentum;
    const perfectSafe = Math.round(safer.pass * depth);
    const midline = Math.round(((safer.pass + bolder.pass) / 2) * depth);

    return {
      failureAtLeast: -midline,
      jackpotAbove: midline,
      partialFailureAtLeast: -perfectSafe,
      partiallySuccessfulAtLeast: 1,
      successfulAtLeast: perfectSafe,
    };
  }

  /** Maps a leaf's cumulative momentum to an outcome tier. */
  static tierForMomentum(
    momentum: number,
    depth: number,
    engine: EngineConfig,
  ): OutcomeTier {
    return this.tierForBands(momentum, this.bands(depth, engine));
  }

  static tierForBands(momentum: number, bands: MomentumBands): OutcomeTier {
    if (momentum > bands.jackpotAbove) return "jackpot";
    if (momentum >= bands.successfulAtLeast) return "successful";
    if (momentum >= bands.partiallySuccessfulAtLeast)
      return "partially_successful";
    if (momentum >= bands.partialFailureAtLeast) return "partial_failure";
    if (momentum >= bands.failureAtLeast) return "failure";
    return "disaster";
  }
}
