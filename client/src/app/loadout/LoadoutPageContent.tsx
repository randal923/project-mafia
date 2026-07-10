"use client";

import type { EquipmentSlotId, Player, PlayerItem } from "@shared/player";
import { useRef, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Inventory } from "../../components/Inventory/Inventory";
import type { InventorySlot } from "../../components/Inventory/InventoryTypes";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { Toast } from "../../components/Toast/Toast";
import { typography } from "../../design-system/typography";
import {
  ApiError,
  equipItem,
  sellItem,
  unequipSlot,
  useInventoryItem as consumeInventoryItem
} from "../../lib/api";
import {
  runOptimisticLoadoutMutation,
  type LoadoutUpdate
} from "./runOptimisticLoadoutMutation";

const slotOrder: readonly { id: EquipmentSlotId; label: string }[] = [
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "hand", label: "Hand" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" }
];

export function LoadoutPageContent() {
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutationInFlight = useRef(false);

  if (status === "loading" || status === "missing") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Opening your armory…</p>
      </div>
    );
  }

  if (status === "error" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>
          Could not reach the family armory. Refresh to try again.
        </p>
      </div>
    );
  }

  const slots: readonly InventorySlot[] = slotOrder.map(({ id, label }) => ({
    id,
    item: player.loadout[id],
    label
  }));

  const runMutation = async (
    mutate: () => Promise<Player>,
    optimisticUpdate?: LoadoutUpdate
  ) => {
    if (!user || mutationInFlight.current) {
      return;
    }

    mutationInFlight.current = true;
    setIsMutating(true);
    setError(null);

    try {
      if (optimisticUpdate) {
        const mutationResult = await runOptimisticLoadoutMutation({
          mutate,
          player,
          setPlayer,
          update: optimisticUpdate
        });

        if (mutationResult.failed) {
          setError(
            mutationResult.error instanceof ApiError
              ? mutationResult.error.message
              : "Something went wrong. Try again."
          );
        }
        return;
      }

      const updated = await mutate();
      if (updated) {
        setPlayer(updated);
      }
    } catch (mutationError) {
      setError(
        mutationError instanceof ApiError
          ? mutationError.message
          : "Something went wrong. Try again."
      );
    } finally {
      mutationInFlight.current = false;
      setIsMutating(false);
    }
  };

  const handleEquip = (item: PlayerItem) =>
    runMutation(() => equipItem(user!, item.id), { item, type: "equip" });
  const handleUnequip = (slotId: EquipmentSlotId) =>
    runMutation(() => unequipSlot(user!, slotId), {
      slotId,
      type: "unequip"
    });
  const handleSell = (item: PlayerItem) =>
    runMutation(() => sellItem(user!, item.id).then((result) => result.player));
  const handleUse = (item: PlayerItem) =>
    runMutation(() => consumeInventoryItem(user!, item.id));

  return (
    <div className="pb-6">
      <h1 className="sr-only">Loadout</h1>
      <Inventory
        actionsDisabled={isMutating}
        ariaLabel={`${player.name} loadout and stash`}
        gearSlotsLabel="Equipped gear"
        loadoutEyebrow={player.name}
        onEquip={handleEquip}
        onSell={handleSell}
        onUnequip={handleUnequip}
        onUse={handleUse}
        playerLevel={player.progression.level}
        slots={slots}
        stashActionLabel="Drag gear between panels"
        stashItems={player.stash}
      />
      {error ? (
        <div className="fixed right-6 bottom-6 z-20">
          <Toast
            message={error}
            onDismiss={() => setError(null)}
            title="No dice"
            tone="failure"
          />
        </div>
      ) : null}
    </div>
  );
}
