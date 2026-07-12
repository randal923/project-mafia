import { EngineConfig } from "../../../shared/engineConfig";
import {
  ChoiceEdge,
  SkillCheck,
  SkillExperiencePreview,
  SkillExperienceSummary,
} from "../../../shared/job";
import { Player } from "../../../shared/player";
import { SkillExperienceSettings } from "../../../shared/missionTemplate";
import { LevelingService } from "./LevelingService";
import { MomentumService } from "./MomentumService";

export type SkillExperienceGain = {
  player: Player;
  /** Skill levels the gain bought (XP resets each 100, see leveling.ts). */
  skillLevelsGained: number;
  xpGained: number;
};

/**
 * Awards per-skill experience for checks the player passes, converting
 * every 100 XP into a skill level. XP numbers live in the mission
 * template (server/missions/*.yml) — tune there, not here.
 */
export class SkillExperienceService {
  static previewForCheck(
    check: SkillCheck,
    settings: SkillExperienceSettings,
  ): SkillExperiencePreview {
    const base =
      settings.basePerSuccess +
      settings.perCheckDifficulty * check.difficulty;

    return {
      criticalSuccess: Math.round(base * settings.criticalMultiplier),
      success: Math.round(base),
    };
  }

  static xpForCheck(
    edge: ChoiceEdge,
    settings: SkillExperienceSettings,
    engine: EngineConfig,
  ): number {
    if (!edge.roll.passed) {
      return 0;
    }

    const preview = this.previewForCheck(edge.check, settings);
    const critical = MomentumService.isCritical(edge.roll, engine);

    return critical ? preview.criticalSuccess : preview.success;
  }

  static summarize(
    edges: readonly ChoiceEdge[],
    settings: SkillExperienceSettings,
    engine: EngineConfig,
  ): SkillExperienceSummary {
    const summary: SkillExperienceSummary = {};

    for (const edge of edges) {
      const xpGained = this.xpForCheck(edge, settings, engine);
      if (xpGained === 0) {
        continue;
      }

      const skill = edge.check.skill;
      summary[skill] = (summary[skill] ?? 0) + xpGained;
    }

    return summary;
  }

  static applyToPlayer(
    player: Player,
    edge: ChoiceEdge,
    settings: SkillExperienceSettings,
    engine: EngineConfig,
    nowIso: string,
  ): SkillExperienceGain {
    const xpGained = this.xpForCheck(edge, settings, engine);
    if (xpGained === 0) {
      return { player, skillLevelsGained: 0, xpGained };
    }

    const leveled = LevelingService.addSkillExperience(
      player,
      edge.check.skill,
      xpGained,
      nowIso,
    );

    return {
      player: leveled.player,
      skillLevelsGained: leveled.levelsGained,
      xpGained,
    };
  }
}
