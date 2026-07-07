import type { Player } from "../../models/player";
import { normalizeLoadout } from "./playerLoadoutDefaults";

export function calculatePlayerPower(player: Player): number {
  const normalizedLoadout = normalizeLoadout(player.loadout);
  const weaponsById = new Map(
    normalizedLoadout.weapons.map((weapon) => [weapon.id, weapon]),
  );
  const equipmentPower = Object.values(normalizedLoadout.equipment).reduce(
    (total, itemId) => {
      if (!itemId) {
        return total;
      }

      return total + (weaponsById.get(itemId)?.power ?? 0);
    },
    0,
  );

  return player.resources.power + equipmentPower;
}
