import { EngineConfig } from "../../../shared/engineConfig";
import { ChoiceEdge } from "../../../shared/job";
import { Player } from "../../../shared/player";
import { SkillExperienceSettings } from "../../../shared/missionTemplate";
import { MomentumService } from "./MomentumService";

export type SkillExperienceGain = {
  player: Player;
  xpGained: number;
};

/**
 * Awards per-skill experience for checks the player passes. Numbers live
 * in the mission template (server/missions/*.yml) — tune there, not here.
 */
export class SkillExperienceService {
  static xpForCheck(
    edge: ChoiceEdge,
    settings: SkillExperienceSettings,
    engine: EngineConfig,
  ): number {
    if (!edge.roll.passed) {
      return 0;
    }

    const base =
      settings.basePerSuccess +
      settings.perCheckDifficulty * edge.check.difficulty;
    const critical = MomentumService.isCritical(edge.roll, engine);

    return Math.round(base * (critical ? settings.criticalMultiplier : 1));
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
      return { player, xpGained };
    }

    const skill = edge.check.skill;

    return {
      player: {
        ...player,
        progression: {
          ...player.progression,
          skillExperience: {
            ...player.progression.skillExperience,
            [skill]: player.progression.skillExperience[skill] + xpGained,
          },
        },
        updatedAt: nowIso,
      },
      xpGained,
    };
  }
}
