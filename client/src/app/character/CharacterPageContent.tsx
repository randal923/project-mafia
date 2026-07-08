"use client";

import { useState, type ReactNode } from "react";
import { CharacterPortrait } from "../../components/CharacterPortrait/CharacterPortrait";
import { CharacterStats } from "../../components/CharacterStats/CharacterStats";
import type { PlayerProfile } from "../../components/CharacterStats/CharacterStatsTypes";
import { Inventory } from "../../components/Inventory/Inventory";
import type {
  InventoryItem,
  InventorySlot
} from "../../components/Inventory/InventoryTypes";
import {
  Tabs,
  tabDomId,
  tabPanelDomId,
  type TabDefinition
} from "../../components/Tabs/Tabs";

type CharacterPageTabId = "loadout" | "overview" | "stash";

type CharacterPageContentProps = {
  profile: PlayerProfile;
  slots: readonly InventorySlot[];
  stashItems: readonly InventoryItem[];
};

const idPrefix = "character-page";

const tabs: readonly TabDefinition<CharacterPageTabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "loadout", label: "Loadout" },
  { id: "stash", label: "Stash" }
];

export function CharacterPageContent({
  profile,
  slots,
  stashItems
}: CharacterPageContentProps) {
  const [activeTabId, setActiveTabId] =
    useState<CharacterPageTabId>("overview");

  const panels: Record<CharacterPageTabId, ReactNode> = {
    loadout: (
      <Inventory showStash={false} slots={slots} stashItems={stashItems} />
    ),
    overview: <CharacterStats profile={profile} />,
    stash: (
      <Inventory showLoadout={false} slots={slots} stashItems={stashItems} />
    )
  };

  return (
    <div className="grid gap-6 lg:h-full lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[minmax(0,1fr)]">
      <CharacterPortrait fit="fill" name={profile.name} title={profile.title} />
      <div className="relative">
        <div className="flex flex-col lg:absolute lg:inset-0">
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
