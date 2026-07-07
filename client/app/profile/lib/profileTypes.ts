import type {
  EquipmentSlotId,
  LoadoutWeapon,
  PlayerLoadout,
  PlayerResources,
} from "../../models/player";

export type { EquipmentSlotId } from "../../models/player";

export type ProfileItem = LoadoutWeapon;

export type ProfileItemsById = Record<string, ProfileItem>;

export type EquipmentSlot = {
  id: EquipmentSlotId;
  label: string;
};

export type ProfileStatus = {
  name: string;
  resources: Pick<PlayerResources, "cleanMoney" | "dirtyMoney" | "power">;
};

export type LoadoutState = Pick<PlayerLoadout, "equipment" | "inventory">;

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
      type: "reset";
      loadoutState: LoadoutState;
    }
  | {
      type: "drop_on_slot";
      payload: DragPayload;
      slotId: EquipmentSlotId;
    }
  | {
      type: "drop_on_inventory";
      payload: DragPayload;
    };
