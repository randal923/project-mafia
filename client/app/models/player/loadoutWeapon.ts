import type { EquipmentSlotId } from "./equipmentSlotId";

export interface LoadoutWeapon {
  id: string;
  label: string;
  slot: EquipmentSlotId;
  detail: string;
  power: number;
  icon: string;
  imageSrc?: string;
}
