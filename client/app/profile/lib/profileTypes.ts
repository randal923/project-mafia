import type { PlayerResources } from "./profileModel";

export type EquipmentSlotId = "hand" | "head" | "torso" | "waist" | "feet";

export type ProfileItem = {
  id: string;
  label: string;
  category: EquipmentSlotId;
  detail: string;
  power: number;
  icon: string;
  imageSrc?: string;
};

export type ProfileItemsById = Record<string, ProfileItem>;

export type EquipmentSlot = {
  id: EquipmentSlotId;
  label: string;
};

export type ProfileStatus = {
  name: string;
  resources: Pick<PlayerResources, "cleanMoney" | "dirtyMoney" | "power">;
};

export type LoadoutState = {
  equipment: Record<EquipmentSlotId, string | null>;
  inventory: string[];
};

export type DragPayload =
  | {
      source: "equipment";
      itemId: string;
      slotId: EquipmentSlotId;
    }
  | {
      source: "inventory";
      itemId: string;
    };

export type LoadoutAction =
  | {
      type: "drop_on_slot";
      payload: DragPayload;
      slotId: EquipmentSlotId;
    }
  | {
      type: "drop_on_inventory";
      payload: DragPayload;
    };
