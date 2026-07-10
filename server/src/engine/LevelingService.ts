import {
  applyPlayerExperience,
  applySkillExperience,
} from "../../../shared/leveling";
import { Player, PlayerSkills } from "../../../shared/player";

export type PlayerLevelUpResult = {
  levelsGained: number;
  player: Player;
};

export type SkillLevelUpResult = {
  levelsGained: number;
  player: Player;
};

/**
 * Applies XP to a player and cashes in level-ups. All curve math lives in
 * shared/leveling.ts so the client can render progress with the same
 * numbers the server levels with.
 */
export class LevelingService {
  static addExperience(
    player: Player,
    xpGained: number,
    nowIso: string,
  ): PlayerLevelUpResult {
    const result = applyPlayerExperience(
      player.progression.level,
      player.progression.experience,
      xpGained,
    );

    return {
      levelsGained: result.levelsGained,
      player: {
        ...player,
        progression: {
          ...player.progression,
          experience: result.experience,
          level: result.level,
        },
        rank: result.rank,
        updatedAt: nowIso,
      },
    };
  }

  static addSkillExperience(
    player: Player,
    skill: keyof PlayerSkills,
    xpGained: number,
    nowIso: string,
  ): SkillLevelUpResult {
    const result = applySkillExperience(
      player.progression.skills,
      player.progression.skillExperience,
      skill,
      xpGained,
    );

    return {
      levelsGained: result.levelsGained,
      player: {
        ...player,
        progression: {
          ...player.progression,
          skillExperience: result.skillExperience,
          skills: result.skills,
        },
        updatedAt: nowIso,
      },
    };
  }
}
