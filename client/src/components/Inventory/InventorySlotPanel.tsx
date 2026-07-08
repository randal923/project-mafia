import { InventoryItemCard } from "./InventoryItemCard";
import type { InventorySlot } from "./InventoryTypes";

type InventorySlotPanelProps = {
  emptyLabel: string;
  placementClassName: string;
  slot: InventorySlot;
};

export function InventorySlotPanel({
  emptyLabel,
  placementClassName,
  slot
}: InventorySlotPanelProps) {
  const classNames = [
    "min-h-36 rounded-panel border bg-surface-raised p-3",
    slot.item ? "border-brass" : "border-line",
    placementClassName
  ].join(" ");
  const ariaLabel = slot.item
    ? `${slot.label} slot equipped with ${slot.item.name}`
    : `${slot.label} slot empty`;

  return (
    <article aria-label={ariaLabel} className={classNames}>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
        <h3 className="m-0 font-display text-xl uppercase leading-none tracking-normal text-muted">
          {slot.label}
        </h3>
        <span className="font-display text-lg uppercase leading-none tracking-normal text-brass">
          Slot
        </span>
      </div>
      <div className="mt-3 flex items-center justify-center border border-line bg-page p-2">
        {slot.item ? (
          <InventoryItemCard compact item={slot.item} />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center border border-dashed border-line bg-black/20 p-3">
            <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-faint">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
