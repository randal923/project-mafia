"use client";

import { useReducer } from "react";
import type { Dispatch } from "react";
import {
  equipmentSlots,
  initialLoadoutState,
  profileItemsById,
  profileStatus,
} from "../lib/profileData";
import { profileLoadoutReducer } from "../lib/profileLoadoutReducer";
import type {
  EquipmentSlot,
  LoadoutAction,
  LoadoutState,
  ProfileItem,
  ProfileItemsById,
  ProfileStatus,
} from "../lib/profileTypes";

type UseProfileResult = {
  dispatchLoadoutAction: Dispatch<LoadoutAction>;
  equipmentSlots: EquipmentSlot[];
  itemsById: ProfileItemsById;
  loadoutState: LoadoutState;
  power: number;
  status: ProfileStatus;
};

export function useProfile(): UseProfileResult {
  const [loadoutState, dispatchLoadoutAction] = useReducer(
    profileLoadoutReducer,
    initialLoadoutState,
  );

  const equippedItems = Object.values(loadoutState.equipment)
    .map((itemId) => (itemId ? profileItemsById[itemId] : null))
    .filter((item): item is ProfileItem => item !== null);
  const power = equippedItems.reduce(
    (total, item) => total + item.power,
    profileStatus.basePower,
  );

  return {
    dispatchLoadoutAction,
    equipmentSlots,
    itemsById: profileItemsById,
    loadoutState,
    power,
    status: profileStatus,
  };
}
