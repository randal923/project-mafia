"use client";

import type { EquipmentSlotId } from "@shared/player";
import { useState, type ReactNode } from "react";
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
import { typography } from "../../design-system/typography";

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
  const { player, status } = usePlayer();
  const [activeTabId, setActiveTabId] =
    useState<CharacterPageTabId>("overview");

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

  const panels: Record<CharacterPageTabId, ReactNode> = {
    loadout: (
      <Inventory showStash={false} slots={slots} stashItems={player.stash} />
    ),
    overview: <CharacterStats profile={player} />,
    stash: (
      <Inventory showLoadout={false} slots={slots} stashItems={player.stash} />
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
          <div
            aria-labelledby={tabDomId(idPrefix, activeTabId)}
            className="mt-4 min-h-0 flex-1 lg:overflow-y-auto"
            id={tabPanelDomId(idPrefix, activeTabId)}
            role="tabpanel"
          >
            {panels[activeTabId]}
          </div>
        </div>
      </div>
    </div>
  );
}
