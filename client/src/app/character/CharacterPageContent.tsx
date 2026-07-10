"use client";

import type { EquipmentSlotId, PlayerItem } from "@shared/player";
import { useState, type ReactNode } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { CharacterPortrait } from "../../components/CharacterPortrait/CharacterPortrait";
import { CharacterStats } from "../../components/CharacterStats/CharacterStats";
import { Inventory } from "../../components/Inventory/Inventory";
import type { InventorySlot } from "../../components/Inventory/InventoryTypes";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import {
  Tabs,
  tabDomId,
  tabPanelDomId,
  type TabDefinition,
} from "../../components/Tabs/Tabs";
import { Toast } from "../../components/Toast/Toast";
import { typography } from "../../design-system/typography";
import { ApiError, equipItem, sellItem, unequipSlot } from "../../lib/api";
import { cx } from "../../lib/cx";

type CharacterPageTabId = "loadout" | "overview" | "stash";

const idPrefix = "character-page";

const defaultPortraitSrc = "/images/characters/gangster-portrait.png";

const tabs: readonly TabDefinition<CharacterPageTabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "loadout", label: "Loadout" },
  { id: "stash", label: "Stash" },
];

const slotOrder: readonly { id: EquipmentSlotId; label: string }[] = [
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "hand", label: "Hand" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" },
];

export function CharacterPageContent() {
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const [activeTabId, setActiveTabId] =
    useState<CharacterPageTabId>("overview");
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading" || status === "missing") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Pulling your file…</p>
      </div>
    );
  }

  if (status === "error" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>
          Could not reach the family archives. Refresh to try again.
        </p>
      </div>
    );
  }

  const slots: readonly InventorySlot[] = slotOrder.map(({ id, label }) => ({
    id,
    item: player.loadout[id],
    label,
  }));

  const runMutation = async (mutate: () => Promise<typeof player>) => {
    if (!user || isMutating) {
      return;
    }
    setIsMutating(true);
    setError(null);
    try {
      const updated = await mutate();
      if (updated) {
        setPlayer(updated);
      }
    } catch (mutationError) {
      setError(
        mutationError instanceof ApiError
          ? mutationError.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleEquip = (item: PlayerItem) =>
    runMutation(() => equipItem(user!, item.id));
  const handleUnequip = (slotId: EquipmentSlotId) =>
    runMutation(() => unequipSlot(user!, slotId));
  const handleSell = (item: PlayerItem) =>
    runMutation(() => sellItem(user!, item.id).then((r) => r.player));

  const panels: Record<CharacterPageTabId, ReactNode> = {
    loadout: (
      <Inventory
        actionsDisabled={isMutating}
        onUnequip={handleUnequip}
        showStash={false}
        slots={slots}
        stashItems={player.stash}
      />
    ),
    overview: <CharacterStats profile={player} />,
    stash: (
      <Inventory
        actionsDisabled={isMutating}
        onEquip={handleEquip}
        onSell={handleSell}
        onUnequip={handleUnequip}
        playerLevel={player.progression.level}
        showLoadout={false}
        slots={slots}
        stashItems={player.stash}
      />
    ),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CharacterPortrait
        fit="fill"
        image={{
          alt: `${player.name} character portrait`,
          src: player.avatar ?? defaultPortraitSrc,
        }}
        name={player.name}
      />
      <div>
        <div className="flex flex-col">
          <Tabs
            activeTabId={activeTabId}
            ariaLabel="Character sections"
            idPrefix={idPrefix}
            onTabChange={setActiveTabId}
            tabs={tabs}
          />
          <div className="mt-4 grid min-h-0 flex-1 lg:overflow-y-auto">
            {tabs.map(({ id }) => (
              <div
                aria-labelledby={tabDomId(idPrefix, id)}
                className={cx(
                  "col-start-1 row-start-1",
                  id !== activeTabId && "invisible",
                )}
                id={tabPanelDomId(idPrefix, id)}
                key={id}
                role="tabpanel"
              >
                {panels[id]}
              </div>
            ))}
          </div>
        </div>
      </div>
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
