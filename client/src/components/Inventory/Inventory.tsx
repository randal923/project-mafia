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
  const classNames = ["w-full max-w-5xl", className]
    .filter(Boolean)
    .join(" ");
  const stashCellCount = Math.max(1, stashCapacity, stashItems.length);
  const stashCells: Array<InventoryItem | undefined> = Array.from(
    { length: stashCellCount },
    (_, index) => stashItems[index]
  );
  const stashClassNames = [
    "rounded-panel border border-line bg-surface shadow-panel",
    showLoadout ? "mt-4" : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (!showLoadout && !showStash) {
    return null;
  }

  return (
    <section aria-label={ariaLabel} className={classNames}>
      {showLoadout ? (
        <div className="rounded-panel border border-line bg-surface shadow-panel">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4">
            <div>
              <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-faint">
                {loadoutEyebrow}
              </p>
              <h2 className="mt-2 mb-0 font-display text-4xl uppercase leading-none tracking-normal text-title">
                {loadoutTitle}
              </h2>
            </div>
            <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-brass">
              {gearSlotsLabel}
            </p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-3 md:grid-rows-3">
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
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4">
            <div>
              <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-faint">
                Inventory
              </p>
              <h2 className="mt-2 mb-0 font-display text-4xl uppercase leading-none tracking-normal text-title">
                {stashTitle}
              </h2>
            </div>
            <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-brass">
              {stashActionLabel}
            </p>
          </div>
          <ol
            aria-label={stashTitle}
            className="m-0 grid list-none grid-cols-2 border-line p-0 sm:grid-cols-4"
          >
            {stashCells.map((item, index) => (
              <li
                aria-label={item ? undefined : "Empty stash slot"}
                className="min-h-36 border-r border-b border-line p-2"
                key={item ? item.id : `stash-empty-${index}`}
              >
                {item ? (
                  <InventoryItemCard item={item} />
                ) : (
                  <div className="flex h-full min-h-28 items-center justify-center border border-dashed border-line bg-black/20 p-3">
                    {index === 0 && stashItems.length === 0 ? (
                      <p className="m-0 text-center text-base leading-relaxed text-muted">
                        {emptyStashLabel}
                      </p>
                    ) : (
                      <span className="sr-only">Empty stash slot</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
