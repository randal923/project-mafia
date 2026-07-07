"use client";

import { useReducer } from "react";
import { useDragState } from "../../hooks/useDragState";
import { CharacterDisplay } from "./CharacterDisplay";
import { DragPreview } from "./DragPreview";
import { EquipmentBoard } from "./EquipmentBoard";
import { StashGrid } from "./StashGrid";
import { StatusPanel } from "./StatusPanel";
import {
  equipmentSlots,
  initialLoadoutState,
  profileItemsById,
  profileStatus,
} from "../lib/profileData";
import { profileLoadoutReducer } from "../lib/profileLoadoutReducer";
import type {
  DragPayload,
  EquipmentSlotId,
  ProfileItem,
} from "../lib/profileTypes";

const dragMimeType = "application/x-project-mafia-item";

function isEquipmentSlotId(value: unknown): value is EquipmentSlotId {
  return equipmentSlots.some((slot) => slot.id === value);
}

export function ProfileLoadout() {
  const [state, dispatch] = useReducer(
    profileLoadoutReducer,
    initialLoadoutState,
  );
  const {
    activeTargetId: activeSlotId,
    clearDragState,
    dragPosition,
    draggedId: draggedItemId,
    setActiveTargetId: setActiveSlotId,
    startDrag: startDragState,
    updateDragPosition,
  } = useDragState<string, EquipmentSlotId>();

  const draggedItem = draggedItemId ? profileItemsById[draggedItemId] : null;
  const equippedItems = Object.values(state.equipment)
    .map((itemId) => (itemId ? profileItemsById[itemId] : null))
    .filter((item): item is ProfileItem => item !== null);
  const power = equippedItems.reduce(
    (total, item) => total + item.power,
    profileStatus.basePower,
  );

  const startDrag = (
    event: React.DragEvent<HTMLElement>,
    payload: DragPayload,
  ) => {
    startDragState(event, {
      data: JSON.stringify(payload),
      draggedId: payload.itemId,
      mimeType: dragMimeType,
    });
  };

  const readPayload = (event: React.DragEvent<HTMLElement>) => {
    const data = event.dataTransfer.getData(dragMimeType);

    if (!data) {
      return null;
    }

    try {
      const payload = JSON.parse(data) as Partial<DragPayload>;

      if (payload.source === "inventory" && typeof payload.itemId === "string") {
        return {
          source: payload.source,
          itemId: payload.itemId,
        } satisfies DragPayload;
      }

      if (
        payload.source === "equipment" &&
        typeof payload.itemId === "string" &&
        isEquipmentSlotId(payload.slotId)
      ) {
        return {
          source: payload.source,
          itemId: payload.itemId,
          slotId: payload.slotId,
        } satisfies DragPayload;
      }

      return null;
    } catch {
      return null;
    }
  };

  const dropOnSlot = (
    event: React.DragEvent<HTMLElement>,
    slotId: EquipmentSlotId,
  ) => {
    event.preventDefault();
    clearDragState();

    const payload = readPayload(event);

    if (!payload) {
      return;
    }

    dispatch({ type: "drop_on_slot", payload, slotId });
  };

  const dropOnInventory = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    clearDragState();

    const payload = readPayload(event);

    if (!payload) {
      return;
    }

    dispatch({ type: "drop_on_inventory", payload });
  };

  const canDropOnSlot = (slotId: EquipmentSlotId) => {
    if (!draggedItemId) {
      return false;
    }

    return profileItemsById[draggedItemId]?.category === slotId;
  };

  return (
    <section
      className="mx-auto grid h-full min-h-0 max-w-[105rem] gap-3 xl:grid-cols-[34rem_minmax(22rem,1fr)_18rem]"
      onDragOver={updateDragPosition}
    >
      <div className="flex min-h-0 flex-col gap-3">
        <EquipmentBoard
          activeSlotId={activeSlotId}
          canDropOnSlot={canDropOnSlot}
          onDragEnd={clearDragState}
          onDragLeave={() => setActiveSlotId(null)}
          onDragMove={updateDragPosition}
          onDragStart={startDrag}
          onDropOnSlot={dropOnSlot}
          onSetActiveSlot={setActiveSlotId}
          state={state}
        />
        <StashGrid
          onDragEnd={clearDragState}
          onDragMove={updateDragPosition}
          onDragStart={startDrag}
          onDropOnInventory={dropOnInventory}
          state={state}
        />
      </div>

      <CharacterDisplay />

      <StatusPanel power={power} />

      <DragPreview item={draggedItem} position={dragPosition} />
    </section>
  );
}
