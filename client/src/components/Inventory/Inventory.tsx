"use client";

import Image from "next/image";
import { useId, useState, type DragEvent } from "react";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { ItemHoverCard } from "../ItemHoverCard/ItemHoverCard";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import {
  Tabs,
  tabDomId,
  tabPanelDomId,
  type TabDefinition
} from "../Tabs/Tabs";
import { InventoryEmptySlot } from "./InventoryEmptySlot";
import { InventoryItemCard } from "./InventoryItemCard";
import { InventorySlotPanel } from "./InventorySlotPanel";
import type {
  InventoryItem,
  InventorySlot,
  InventorySlotId
} from "./InventoryTypes";

type InventoryProps = {
  actionsDisabled?: boolean;
  ariaLabel?: string;
  className?: string;
  emptySlotLabel?: string;
  emptyStashLabel?: string;
  gearSlotsLabel?: string;
  loadoutEyebrow?: string;
  loadoutTitle?: string;
  onEquip?: (item: InventoryItem) => void;
  onSell?: (item: InventoryItem) => void;
  onUnequip?: (slotId: InventorySlotId) => void;
  onUse?: (item: InventoryItem) => void;
  playerLevel?: number;
  showLoadout?: boolean;
  showStash?: boolean;
  slots: readonly InventorySlot[];
  stashActionLabel?: string;
  stashItems: readonly InventoryItem[];
  stashSlotsPerPage?: number;
  stashTitle?: string;
};

const slotPlacementClasses: Record<InventorySlotId, string> = {
  feet: "md:col-start-2 md:row-start-3",
  hand: "md:col-start-1 md:row-start-2",
  head: "md:col-start-2 md:row-start-1",
  torso: "md:col-start-2 md:row-start-2",
  waist: "md:col-start-3 md:row-start-2"
};

type StashTabId = "stash-1" | "stash-2" | "stash-3";

type InventoryDrag =
  | { item: InventoryItem; source: "stash" }
  | { item: InventoryItem; slotId: InventorySlotId; source: "loadout" };

const stashTabs: readonly TabDefinition<StashTabId>[] = [
  { id: "stash-1", label: "Stash I" },
  { id: "stash-2", label: "Stash II" },
  { id: "stash-3", label: "Stash III" }
];

export function Inventory({
  actionsDisabled = false,
  ariaLabel = "Inventory",
  className,
  emptySlotLabel = "Empty",
  emptyStashLabel = "No stash items.",
  gearSlotsLabel = "Gear slots",
  loadoutEyebrow = "Profile",
  loadoutTitle = "Loadout",
  onEquip,
  onSell,
  onUnequip,
  onUse,
  playerLevel,
  showLoadout = true,
  showStash = true,
  slots,
  stashActionLabel = "Drop to unequip",
  stashItems,
  stashSlotsPerPage = 12,
  stashTitle = "Stash"
}: InventoryProps) {
  const [activeStashTabId, setActiveStashTabId] =
    useState<StashTabId>("stash-1");
  const [inventoryDrag, setInventoryDrag] = useState<InventoryDrag | null>(
    null
  );
  const stashIdPrefix = `inventory-stash-${useId()}`;
  const showsWorkspace = showLoadout && showStash;
  const isLoadoutDropTarget =
    showsWorkspace &&
    !actionsDisabled &&
    inventoryDrag?.source === "stash" &&
    Boolean(onEquip);
  const isStashDropTarget =
    showsWorkspace &&
    !actionsDisabled &&
    inventoryDrag?.source === "loadout" &&
    Boolean(onUnequip);
  const classNames = cx(
    "w-full",
    showsWorkspace
      ? "max-w-none xl:grid xl:grid-cols-2 xl:gap-4"
      : "max-w-5xl",
    className
  );
  const normalizedStashSlotsPerPage = Number.isFinite(stashSlotsPerPage)
    ? Math.max(1, Math.floor(stashSlotsPerPage))
    : 1;
  const stashCellCount = Math.max(
    1,
    normalizedStashSlotsPerPage,
    Math.ceil(stashItems.length / stashTabs.length)
  );
  const stashPages: ReadonlyArray<ReadonlyArray<InventoryItem | undefined>> =
    stashTabs.map((_, pageIndex) =>
      Array.from(
        { length: stashCellCount },
        (_, index) => stashItems[pageIndex * stashCellCount + index]
      )
    );
  const loadoutClassNames = cx(
    "relative isolate overflow-hidden rounded-panel border border-line bg-surface shadow-panel",
    isLoadoutDropTarget && "ring-1 ring-brass"
  );
  const stashClassNames = cx(
    "rounded-panel border border-line bg-surface shadow-panel",
    showLoadout && "mt-4 xl:mt-0",
    isStashDropTarget && "ring-1 ring-brass"
  );

  const handleStashItemDragStart = (
    event: DragEvent<HTMLDivElement>,
    item: InventoryItem
  ) => {
    const belowLevelRequirement =
      item.levelRequirement !== undefined &&
      playerLevel !== undefined &&
      playerLevel < item.levelRequirement;

    if (
      !showsWorkspace ||
      actionsDisabled ||
      !onEquip ||
      !item.slot ||
      belowLevelRequirement
    ) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.name);
    setInventoryDrag({ item, source: "stash" });
  };

  const handleLoadoutItemDragStart = (
    event: DragEvent<HTMLDivElement>,
    slot: InventorySlot
  ) => {
    if (!showsWorkspace || actionsDisabled || !onUnequip || !slot.item) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", slot.item.name);
    setInventoryDrag({
      item: slot.item,
      slotId: slot.id,
      source: "loadout"
    });
  };

  const handleLoadoutDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isLoadoutDropTarget) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleStashDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isStashDropTarget) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleLoadoutDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isLoadoutDropTarget || inventoryDrag?.source !== "stash") {
      return;
    }

    event.preventDefault();
    const { item } = inventoryDrag;
    setInventoryDrag(null);
    onEquip?.(item);
  };

  const handleStashDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isStashDropTarget || inventoryDrag?.source !== "loadout") {
      return;
    }

    event.preventDefault();
    const draggedSlot = slots.find(({ id }) => id === inventoryDrag.slotId);
    if (draggedSlot?.item !== inventoryDrag.item) {
      setInventoryDrag(null);
      return;
    }

    const { slotId } = inventoryDrag;
    setInventoryDrag(null);
    onUnequip?.(slotId);
  };

  const handleItemDragEnd = () => setInventoryDrag(null);

  if (!showLoadout && !showStash) {
    return null;
  }

  return (
    <section aria-label={ariaLabel} className={classNames}>
      {showLoadout ? (
        <div
          className={loadoutClassNames}
          onDragOver={handleLoadoutDragOver}
          onDrop={handleLoadoutDrop}
        >
          <SectionHeader
            aside={gearSlotsLabel}
            eyebrow={loadoutEyebrow}
            title={loadoutTitle}
          />
          <div className="pointer-events-none absolute inset-x-0 top-28 bottom-4 z-0">
            <Image
              alt=""
              className="object-contain p-4 opacity-20 invert"
              fill
              sizes="(min-width: 1280px) 38rem, 100vw"
              src="/images/characters/gangster-loadout-silhouette.png"
            />
          </div>
          <div className="relative z-10 mx-auto grid w-full max-w-lg gap-4 p-4 md:grid-cols-3 md:grid-rows-3">
            {slots.map((slot) => (
              <InventorySlotPanel
                actionsDisabled={actionsDisabled}
                emptyLabel={emptySlotLabel}
                key={slot.id}
                onItemDragEnd={handleItemDragEnd}
                onItemDragStart={
                  showsWorkspace && onUnequip
                    ? handleLoadoutItemDragStart
                    : undefined
                }
                onUnequip={onUnequip}
                placementClassName={slotPlacementClasses[slot.id]}
                slot={slot}
              />
            ))}
          </div>
        </div>
      ) : null}

      {showStash ? (
        <div
          className={stashClassNames}
          onDragOver={handleStashDragOver}
          onDrop={handleStashDrop}
        >
          <SectionHeader
            aside={stashActionLabel}
            eyebrow="Inventory"
            title={stashTitle}
          />
          <Tabs
            activeTabId={activeStashTabId}
            ariaLabel="Stash pages"
            idPrefix={stashIdPrefix}
            onTabChange={setActiveStashTabId}
            tabs={stashTabs}
          />
          {stashTabs.map((tab, pageIndex) => (
            <div
              aria-labelledby={tabDomId(stashIdPrefix, tab.id)}
              hidden={tab.id !== activeStashTabId}
              id={tabPanelDomId(stashIdPrefix, tab.id)}
              key={tab.id}
              role="tabpanel"
            >
              <ol
                aria-label={`${stashTitle} page ${pageIndex + 1}`}
                className={cx(
                  "m-0 grid list-none grid-cols-2 border-line p-0 sm:grid-cols-4",
                  showsWorkspace && "xl:grid-cols-3"
                )}
              >
                {stashPages[pageIndex].map((item, index) => (
                  <li
                    aria-label={item ? undefined : "Empty stash slot"}
                    className="h-full border-r border-b border-line p-2"
                    key={
                      item
                        ? `${item.id}-${pageIndex}-${index}`
                        : `${tab.id}-empty-${index}`
                    }
                  >
                    <div className="flex h-full flex-col gap-2">
                      {item ? (
                        <ItemHoverCard item={item}>
                          <InventoryItemCard
                            draggable={
                              showsWorkspace &&
                              !actionsDisabled &&
                              Boolean(onEquip && item.slot) &&
                              !(
                                item.levelRequirement !== undefined &&
                                playerLevel !== undefined &&
                                playerLevel < item.levelRequirement
                              )
                            }
                            item={item}
                            onDragEnd={handleItemDragEnd}
                            onDragStart={(event) =>
                              handleStashItemDragStart(event, item)
                            }
                          />
                        </ItemHoverCard>
                      ) : (
                        <InventoryEmptySlot>
                          {index === 0 && stashItems.length === 0 ? (
                            <p className="m-0 text-center text-base leading-relaxed text-muted">
                              {emptyStashLabel}
                            </p>
                          ) : (
                            <span className="sr-only">Empty stash slot</span>
                          )}
                        </InventoryEmptySlot>
                      )}
                      <div className="min-h-24 xl:min-h-10">
                      {item && (onEquip || onSell || onUse) ? (
                        <div className="flex flex-col gap-2 xl:flex-row">
                          {onUse && item.use ? (
                            <Button
                              className="flex-1"
                              disabled={
                                actionsDisabled ||
                                (item.levelRequirement !== undefined &&
                                  playerLevel !== undefined &&
                                  playerLevel < item.levelRequirement)
                              }
                              onClick={() => onUse(item)}
                              size="small"
                              variant="primary"
                            >
                              Use
                            </Button>
                          ) : null}
                          {onEquip && item.slot ? (
                            <Button
                              className="flex-1"
                              disabled={
                                actionsDisabled ||
                                (item.levelRequirement !== undefined &&
                                  playerLevel !== undefined &&
                                  playerLevel < item.levelRequirement)
                              }
                              onClick={() => onEquip(item)}
                              size="small"
                              variant="secondary"
                            >
                              {item.levelRequirement !== undefined &&
                              playerLevel !== undefined &&
                              playerLevel < item.levelRequirement
                                ? `Lv ${item.levelRequirement}`
                                : "Equip"}
                            </Button>
                          ) : null}
                          {onSell ? (
                            <Button
                              className="flex-1"
                              disabled={actionsDisabled}
                              onClick={() => onSell(item)}
                              size="small"
                              variant="quiet"
                            >
                              Sell
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
