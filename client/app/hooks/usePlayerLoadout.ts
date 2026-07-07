"use client";

import { useEffect, useMemo, useReducer } from "react";
import type { Dispatch } from "react";
import {
  equipmentSlots,
  normalizeLoadout,
} from "../player/lib/playerLoadoutDefaults";
import { playerLoadoutReducer } from "../player/lib/playerLoadoutReducer";
import type { Player } from "../models/player";
import type {
  EquipmentSlot,
  LoadoutAction,
  LoadoutState,
  PlayerItem,
  PlayerItemsById,
  PlayerStatus,
} from "../player/lib/playerTypes";

type UsePlayerLoadoutResult = {
  dispatchLoadoutAction: Dispatch<LoadoutAction>;
  equipmentSlots: EquipmentSlot[];
  itemsById: PlayerItemsById;
  loadoutState: LoadoutState;
  power: number;
  status: PlayerStatus;
};

export function usePlayerLoadout(player: Player): UsePlayerLoadoutResult {
  const normalizedLoadout = useMemo(
    () => normalizeLoadout(player.loadout),
    [player.loadout],
  );
  const itemsById = useMemo(
    () =>
      Object.fromEntries(
        normalizedLoadout.weapons.map((item) => [item.id, item]),
      ) as PlayerItemsById,
    [normalizedLoadout.weapons],
  );
  const playerLoadoutState = useMemo<LoadoutState>(
    () => ({
      equipment: normalizedLoadout.equipment,
      inventory: normalizedLoadout.inventory,
    }),
    [normalizedLoadout],
  );
  const [loadoutState, dispatchLoadoutAction] = useReducer(
    (state: LoadoutState, action: LoadoutAction) =>
      playerLoadoutReducer(state, action, itemsById),
    playerLoadoutState,
  );
  const status = useMemo<PlayerStatus>(
    () => ({
      name: player.nickname || player.name,
      resources: {
        cleanMoney: player.resources.cleanMoney,
        dirtyMoney: player.resources.dirtyMoney,
        power: player.resources.power,
      },
    }),
    [
      player.name,
      player.nickname,
      player.resources.cleanMoney,
      player.resources.dirtyMoney,
      player.resources.power,
    ],
  );

  useEffect(() => {
    dispatchLoadoutAction({
      type: "reset",
      loadoutState: playerLoadoutState,
    });
  }, [playerLoadoutState]);

  const equippedItems = Object.values(loadoutState.equipment)
    .map((itemId) => (itemId ? itemsById[itemId] : null))
    .filter((item): item is PlayerItem => item !== null);
  const power = equippedItems.reduce(
    (total, item) => total + item.power,
    player.resources.power,
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
