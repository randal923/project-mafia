import { Player, PlayerLoadout, PlayerSkills } from "./player";

export function calculateLoadoutPower(loadout: PlayerLoadout): number {
  return Object.values(loadout).reduce(
    (sum, item) => sum + (item?.power ?? 0),
    0,
  );
}

/** Total power: base resources.power plus every equipped item's power. */
export function calculatePlayerPower(player: Player): number {
  return player.resources.power + calculateLoadoutPower(player.loadout);
}

/** Total armor across the equipped loadout. */
export function calculateLoadoutArmor(loadout: PlayerLoadout): number {
  return Object.values(loadout).reduce(
    (sum, item) => sum + (item?.armor ?? 0),
    0,
  );
}

/** Summed passive bonuses from every equipped item's effects. */
export type LoadoutBonuses = {
  approachBonus: Record<string, number>;
  heatReduction: number;
  skillBonus: Partial<Record<keyof PlayerSkills, number>>;
};

export function calculateLoadoutBonuses(loadout: PlayerLoadout): LoadoutBonuses {
  const bonuses: LoadoutBonuses = {
    approachBonus: {},
    heatReduction: 0,
    skillBonus: {},
  };

  for (const item of Object.values(loadout)) {
    for (const effect of item?.effects ?? []) {
      if (effect.type === "skillBonus") {
        bonuses.skillBonus[effect.skill] =
          (bonuses.skillBonus[effect.skill] ?? 0) + effect.value;
      } else if (effect.type === "approachBonus") {
        bonuses.approachBonus[effect.approach] =
          (bonuses.approachBonus[effect.approach] ?? 0) + effect.value;
      } else {
        bonuses.heatReduction += effect.value;
      }
    }
  }

  return bonuses;
}
