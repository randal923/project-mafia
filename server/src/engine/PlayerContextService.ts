import { PLAYER_RANKS, Player, PlayerSkills } from "../../../shared/player";
import {
  LoadoutBonuses,
  calculateLoadoutArmor,
  calculateLoadoutBonuses,
  calculatePlayerPower,
} from "../../../shared/playerPower";

/** What the player owns for one gear tag when a mission is accepted. */
export type GearAvailability = {
  /** Total quantity across consumable stash items with this tag. */
  consumables: number;
  /** True if a non-consumable item (tool, equipped gear) carries the tag. */
  permanent: boolean;
};

/** The projection of a player the engine computes from. */
export type EnginePlayerContext = {
  armor: number;
  bonuses: LoadoutBonuses;
  /** How drunk (0-100); debuffs every check. */
  drunk: number;
  effectivePower: number;
  /** tag → availability, from the loadout plus the stash. */
  gearTags: Record<string, GearAvailability>;
  heat: number;
  /** How high (0-100); debuffs every check. */
  high: number;
  level: number;
  rankTier: number;
  skills: PlayerSkills;
};

export class PlayerContextService {
  static fromPlayer(player: Player): EnginePlayerContext {
    return {
      armor: calculateLoadoutArmor(player.loadout),
      bonuses: calculateLoadoutBonuses(player.loadout),
      drunk: player.resources.drunk,
      effectivePower: calculatePlayerPower(player),
      gearTags: this.gearTags(player),
      heat: player.resources.heat,
      high: player.resources.high,
      level: player.progression.level,
      rankTier: Math.max(0, PLAYER_RANKS.indexOf(player.rank)),
      skills: player.progression.skills,
    };
  }

  private static gearTags(player: Player): Record<string, GearAvailability> {
    const tags: Record<string, GearAvailability> = {};
    const items = [...Object.values(player.loadout), ...player.stash];

    for (const item of items) {
      if (!item?.tags?.length) continue;

      for (const tag of item.tags) {
        const entry = (tags[tag] ??= { consumables: 0, permanent: false });
        if (item.consumable) {
          entry.consumables += item.quantity ?? 1;
        } else {
          entry.permanent = true;
        }
      }
    }

    return tags;
  }
}
