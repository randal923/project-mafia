import type {
  EquipmentSlotId,
  PlayerItem,
  PlayerItemTone
} from "@shared/player";

export type InventoryItemTone = PlayerItemTone;

export type InventoryItem = PlayerItem;

export type InventorySlotId = EquipmentSlotId;

export type InventorySlot = {
  id: InventorySlotId;
  item?: InventoryItem;
  label: string;
};
