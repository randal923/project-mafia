import { Player, PlayerLoadout } from "./player";

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
