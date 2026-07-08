export type InventoryItemTone =
  | "brass"
  | "danger"
  | "neutral"
  | "profit"
  | "teal";

export type InventoryItem = {
  category: string;
  detail?: string;
  id: string;
  name: string;
  quantityLabel?: string;
  tone?: InventoryItemTone;
};

export type InventorySlotId = "feet" | "hand" | "head" | "torso" | "waist";

export type InventorySlot = {
  id: InventorySlotId;
  item?: InventoryItem;
  label: string;
};
