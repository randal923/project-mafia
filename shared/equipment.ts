import { EquipmentSlotId, PlayerItem } from "./player";

export type Equipment = {
  id: string;
  image: {
    alt: string;
    src: string;
  };
  name: string;
  power: number;
  slot: EquipmentSlotId;
};

export const STARTER_EQUIPMENT_ID = "stiletto-knife";

export function equipmentToPlayerItem(
  equipment: Equipment,
  quantity = 1,
): PlayerItem {
  return {
    id: equipment.id,
    image: equipment.image,
    name: equipment.name,
    power: equipment.power,
    quantity,
  };
}
