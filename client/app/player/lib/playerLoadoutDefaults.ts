import type { EquipmentSlotId, PlayerLoadout } from "../../models/player";
import type { EquipmentSlot, PlayerItem } from "./playerTypes";

export const equipmentSlots: EquipmentSlot[] = [
  { id: "hand", label: "Hand" },
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" },
];

const equipmentSlotIds = equipmentSlots.map((slot) => slot.id);

export const defaultKnifeWeapon: PlayerItem = {
  id: "stiletto-knife",
  label: "Stiletto Knife",
  slot: "hand",
  detail: "Close weapon",
  power: 5,
  icon: "KN",
  imageSrc: "/assets/player/knife.png",
};

function createDefaultEquipment(): PlayerLoadout["equipment"] {
  return {
    hand: defaultKnifeWeapon.id,
    head: null,
    torso: null,
    waist: null,
    feet: null,
  };
}

export function createDefaultLoadout(): PlayerLoadout {
  return {
    equipment: createDefaultEquipment(),
    inventory: [],
    weapons: [{ ...defaultKnifeWeapon }],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEquipmentSlotId(value: unknown): value is EquipmentSlotId {
  return equipmentSlotIds.some((slotId) => slotId === value);
}

function isLoadoutWeapon(value: unknown): value is PlayerItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isEquipmentSlotId(value.slot) &&
    typeof value.detail === "string" &&
    typeof value.power === "number" &&
    typeof value.icon === "string" &&
    (value.imageSrc === undefined || typeof value.imageSrc === "string")
  );
}

export function normalizeLoadout(loadout: unknown): PlayerLoadout {
  const defaultLoadout = createDefaultLoadout();

  if (!isRecord(loadout)) {
    return defaultLoadout;
  }

  const equipment = { ...defaultLoadout.equipment };
  const loadoutEquipment = loadout.equipment;

  if (isRecord(loadoutEquipment)) {
    equipmentSlotIds.forEach((slotId) => {
      const equippedItemId = loadoutEquipment[slotId];

      if (typeof equippedItemId === "string" || equippedItemId === null) {
        equipment[slotId] = equippedItemId;
      }
    });
  }

  const inventory = Array.isArray(loadout.inventory)
    ? loadout.inventory.filter(
        (itemId): itemId is string => typeof itemId === "string",
      )
    : defaultLoadout.inventory;
  const weapons = Array.isArray(loadout.weapons)
    ? loadout.weapons.filter(isLoadoutWeapon)
    : defaultLoadout.weapons;

  if (!weapons.some((weapon) => weapon.id === defaultKnifeWeapon.id)) {
    weapons.unshift({ ...defaultKnifeWeapon });
  }

  return {
    equipment,
    inventory,
    weapons,
  };
}

export function shouldBackfillLoadout(loadout: unknown): boolean {
  if (!isRecord(loadout)) {
    return true;
  }

  const loadoutEquipment = loadout.equipment;

  if (!isRecord(loadoutEquipment) || !Array.isArray(loadout.inventory)) {
    return true;
  }

  if (equipmentSlotIds.some((slotId) => !(slotId in loadoutEquipment))) {
    return true;
  }

  if (!Array.isArray(loadout.weapons)) {
    return true;
  }

  return !loadout.weapons.some(
    (weapon) => isLoadoutWeapon(weapon) && weapon.id === defaultKnifeWeapon.id,
  );
}
