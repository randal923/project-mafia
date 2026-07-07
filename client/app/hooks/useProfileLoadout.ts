"use client";

import { useEffect, useMemo, useReducer } from "react";
import type { Dispatch } from "react";
import {
  equipmentSlots,
  normalizeLoadout,
} from "../profile/lib/profileLoadoutDefaults";
import { profileLoadoutReducer } from "../profile/lib/profileLoadoutReducer";
import type { Profile } from "../models/player";
import type {
  EquipmentSlot,
  LoadoutAction,
  LoadoutState,
  ProfileItem,
  ProfileItemsById,
  ProfileStatus,
} from "../profile/lib/profileTypes";

type UseProfileLoadoutResult = {
  dispatchLoadoutAction: Dispatch<LoadoutAction>;
  equipmentSlots: EquipmentSlot[];
  itemsById: ProfileItemsById;
  loadoutState: LoadoutState;
  power: number;
  status: ProfileStatus;
};

export function useProfileLoadout(profile: Profile): UseProfileLoadoutResult {
  const normalizedLoadout = useMemo(
    () => normalizeLoadout(profile.loadout),
    [profile.loadout],
  );
  const itemsById = useMemo(
    () =>
      Object.fromEntries(
        normalizedLoadout.weapons.map((item) => [item.id, item]),
      ) as ProfileItemsById,
    [normalizedLoadout.weapons],
  );
  const profileLoadoutState = useMemo<LoadoutState>(
    () => ({
      equipment: normalizedLoadout.equipment,
      inventory: normalizedLoadout.inventory,
    }),
    [normalizedLoadout],
  );
  const [loadoutState, dispatchLoadoutAction] = useReducer(
    (state: LoadoutState, action: LoadoutAction) =>
      profileLoadoutReducer(state, action, itemsById),
    profileLoadoutState,
  );
  const status = useMemo<ProfileStatus>(
    () => ({
      name: profile.nickname || profile.name,
      resources: {
        cleanMoney: profile.resources.cleanMoney,
        dirtyMoney: profile.resources.dirtyMoney,
        power: profile.resources.power,
      },
    }),
    [
      profile.name,
      profile.nickname,
      profile.resources.cleanMoney,
      profile.resources.dirtyMoney,
      profile.resources.power,
    ],
  );

  useEffect(() => {
    dispatchLoadoutAction({
      type: "reset",
      loadoutState: profileLoadoutState,
    });
  }, [profileLoadoutState]);

  const equippedItems = Object.values(loadoutState.equipment)
    .map((itemId) => (itemId ? itemsById[itemId] : null))
    .filter((item): item is ProfileItem => item !== null);
  const power = equippedItems.reduce(
    (total, item) => total + item.power,
    profile.resources.power,
  );

  return {
    dispatchLoadoutAction,
    equipmentSlots,
    itemsById,
    loadoutState,
    power,
    status,
  };
}
