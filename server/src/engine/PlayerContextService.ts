import { PLAYER_RANKS, Player, PlayerSkills } from "../../../shared/player";
import { calculatePlayerPower } from "../../../shared/playerPower";

/** The projection of a player the engine computes from. */
export type EnginePlayerContext = {
  effectivePower: number;
  heat: number;
  rankTier: number;
  skills: PlayerSkills;
};

export class PlayerContextService {
  static fromPlayer(player: Player): EnginePlayerContext {
    return {
      effectivePower: calculatePlayerPower(player),
      heat: player.resources.heat,
      rankTier: Math.max(0, PLAYER_RANKS.indexOf(player.rank)),
      skills: player.progression.skills,
    };
  }
}
