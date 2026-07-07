import type { EquipmentSlotId } from "./equipmentSlotId";
import type { LoadoutWeapon } from "./loadoutWeapon";

export interface PlayerLoadout {
  equipment: Record<EquipmentSlotId, string | null>;
  inventory: string[];
  weapons: LoadoutWeapon[];
}
