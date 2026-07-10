import { MissionAcceptedState } from "../../../shared/job";
import { MissionTemplate } from "../../../shared/missionTemplate";
import {
  PLAYER_RANKS,
  Player,
  PlayerItem,
  PlayerSkills,
} from "../../../shared/player";
import {
  LoadoutBonuses,
  calculateLoadoutArmor,
  calculateLoadoutBonuses,
  calculateLoadoutPower,
  calculatePlayerPower,
} from "../../../shared/playerPower";

/** What the player owns for one gear tag when a mission is accepted. */
export type GearAvailability = {
  /** Total quantity across consumable stash items with this tag. */
  consumables: number;
  /** True if a non-consumable item (tool, equipped gear) carries the tag. */
  permanent: boolean;
};

export type EngineGearItem = {
  consumable: boolean;
  id: string;
  name: string;
  power: number;
  quantity: number;
  tags: string[];
};

/** The projection of a player the engine computes from. */
export type EnginePlayerContext = {
  armor: number;
  bonuses: LoadoutBonuses;
  characterPower: number;
  /** How drunk (0-100); debuffs every check. */
  drunk: number;
  effectivePower: number;
  equipmentPower: number;
  /** Exact tagged items available when the mission was accepted. */
  gearItems: EngineGearItem[];
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
      characterPower: player.resources.power,
      drunk: player.resources.drunk,
      effectivePower: calculatePlayerPower(player),
      equipmentPower: calculateLoadoutPower(player.loadout),
      gearItems: this.gearItems(player),
      gearTags: this.gearTags(player),
      heat: player.resources.heat,
      high: player.resources.high,
      level: player.progression.level,
      rankTier: Math.max(0, PLAYER_RANKS.indexOf(player.rank)),
      skills: player.progression.skills,
    };
  }

  static acceptedState(
    player: Player,
    template: MissionTemplate,
  ): MissionAcceptedState {
    const context = this.fromPlayer(player);
    const relevantTags = new Set(
      (template.gear ?? []).flatMap((requirement) => requirement.tags),
    );
    const relevantGear = player.stash.filter((item) =>
      item.tags?.some((tag) => relevantTags.has(tag)),
    );

    return {
      armor: context.armor,
      characterPower: context.characterPower,
      equipmentPower: context.equipmentPower,
      gear: relevantGear.map((item) => this.copyItem(item)),
      loadout: Object.fromEntries(
        Object.entries(player.loadout).map(([slot, item]) => [
          slot,
          this.copyItem(item),
        ]),
      ),
      totalPower: context.effectivePower,
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

  private static gearItems(player: Player): EngineGearItem[] {
    return [...Object.values(player.loadout), ...player.stash]
      .filter((item): item is PlayerItem => Boolean(item?.tags?.length))
      .map((item) => ({
        consumable: item.consumable ?? false,
        id: item.id,
        name: item.name,
        power: item.power ?? 0,
        quantity: item.quantity ?? 1,
        tags: [...(item.tags ?? [])],
      }))
      .sort((a, b) => b.power - a.power || a.id.localeCompare(b.id));
  }

  private static copyItem(item: PlayerItem): PlayerItem {
    return {
      ...item,
      ...(item.effects && { effects: item.effects.map((effect) => ({ ...effect })) }),
      ...(item.image && { image: { ...item.image } }),
      ...(item.tags && { tags: [...item.tags] }),
      ...(item.use && { use: { ...item.use } }),
    };
  }
}
