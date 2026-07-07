import { profileItemsById } from "./profileData";
import type { LoadoutAction, LoadoutState } from "./profileTypes";

export function profileLoadoutReducer(
  state: LoadoutState,
  action: LoadoutAction,
): LoadoutState {
  if (action.type === "drop_on_inventory") {
    if (action.payload.source === "inventory") {
      return state;
    }

    return {
      equipment: {
        ...state.equipment,
        [action.payload.slotId]: null,
      },
      inventory: [...state.inventory, action.payload.itemId],
    };
  }

  const item = profileItemsById[action.payload.itemId];

  if (!item || item.category !== action.slotId) {
    return state;
  }

  if (action.payload.source === "equipment") {
    return state;
  }

  const equippedItemId = state.equipment[action.slotId];
  const nextInventory = state.inventory.filter(
    (itemId) => itemId !== action.payload.itemId,
  );

  if (equippedItemId && equippedItemId !== action.payload.itemId) {
    nextInventory.push(equippedItemId);
  }

  const nextEquipment = {
    ...state.equipment,
    [action.slotId]: action.payload.itemId,
  };

  return {
    equipment: nextEquipment,
    inventory: nextInventory,
  };
}
