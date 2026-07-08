import { cx } from "../../lib/cx";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { InventoryEmptySlot } from "./InventoryEmptySlot";
import { InventoryItemCard } from "./InventoryItemCard";
import { InventorySlotPanel } from "./InventorySlotPanel";
import type {
  InventoryItem,
  InventorySlot,
  InventorySlotId
} from "./InventoryTypes";

type InventoryProps = {
  ariaLabel?: string;
  className?: string;
  emptySlotLabel?: string;
  emptyStashLabel?: string;
  gearSlotsLabel?: string;
  loadoutEyebrow?: string;
  loadoutTitle?: string;
  showLoadout?: boolean;
  showStash?: boolean;
  slots: readonly InventorySlot[];
  stashActionLabel?: string;
  stashCapacity?: number;
  stashItems: readonly InventoryItem[];
  stashTitle?: string;
};

const slotPlacementClasses: Record<InventorySlotId, string> = {
  feet: "md:col-start-2 md:row-start-3",
  hand: "md:col-start-1 md:row-start-2",
  head: "md:col-start-2 md:row-start-1",
  torso: "md:col-start-2 md:row-start-2",
  waist: "md:col-start-3 md:row-start-2"
};

export function Inventory({
  ariaLabel = "Inventory",
  className,
  emptySlotLabel = "Empty",
  emptyStashLabel = "No stash items.",
  gearSlotsLabel = "Gear slots",
  loadoutEyebrow = "Profile",
  loadoutTitle = "Loadout",
  showLoadout = true,
  showStash = true,
  slots,
  stashActionLabel = "Drop to unequip",
  stashCapacity = 8,
  stashItems,
  stashTitle = "Stash"
}: InventoryProps) {
  const classNames = cx("w-full max-w-5xl", className);
  const stashCellCount = Math.max(1, stashCapacity, stashItems.length);
  const stashCells: Array<InventoryItem | undefined> = Array.from(
    { length: stashCellCount },
    (_, index) => stashItems[index]
  );
  const stashClassNames = cx(
    "rounded-panel border border-line bg-surface shadow-panel",
    showLoadout && "mt-4"
  );

  if (!showLoadout && !showStash) {
    return null;
  }

  return (
    <section aria-label={ariaLabel} className={classNames}>
      {showLoadout ? (
        <div className="rounded-panel border border-line bg-surface shadow-panel">
          <SectionHeader
            aside={gearSlotsLabel}
            eyebrow={loadoutEyebrow}
            title={loadoutTitle}
          />
          <div className="mx-auto grid w-full max-w-xl gap-4 p-4 md:grid-cols-3 md:grid-rows-3">
            {slots.map((slot) => (
              <InventorySlotPanel
                emptyLabel={emptySlotLabel}
                key={slot.id}
                placementClassName={slotPlacementClasses[slot.id]}
                slot={slot}
              />
            ))}
          </div>
        </div>
      ) : null}

      {showStash ? (
        <div className={stashClassNames}>
          <SectionHeader
            aside={stashActionLabel}
            eyebrow="Inventory"
            title={stashTitle}
          />
          <ol
            aria-label={stashTitle}
            className="m-0 grid list-none grid-cols-2 border-line p-0 sm:grid-cols-4"
          >
            {stashCells.map((item, index) => (
              <li
                aria-label={item ? undefined : "Empty stash slot"}
                className="border-r border-b border-line p-2"
                key={item ? item.id : `stash-empty-${index}`}
              >
                {item ? (
                  <InventoryItemCard item={item} />
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
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
