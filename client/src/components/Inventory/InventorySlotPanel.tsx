import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { ItemHoverCard } from "../ItemHoverCard/ItemHoverCard";
import { InventoryEmptySlot } from "./InventoryEmptySlot";
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
  const classNames = cx(
    "min-h-36 rounded-panel border bg-surface-raised p-3",
    slot.item ? "border-brass" : "border-line",
    placementClassName
  );
  const ariaLabel = slot.item
    ? `${slot.label} slot equipped with ${slot.item.name}`
    : `${slot.label} slot empty`;

  return (
    <article aria-label={ariaLabel} className={classNames}>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
        <h3 className={`m-0 ${displayText} text-xl text-muted`}>
          {slot.label}
        </h3>
        <span className={`${displayText} text-lg text-brass`}>Slot</span>
      </div>
      <div className="mt-3 flex items-center justify-center border border-line bg-page p-2">
        {slot.item ? (
          <ItemHoverCard className="w-full" item={slot.item}>
            <InventoryItemCard compact item={slot.item} />
          </ItemHoverCard>
        ) : (
          <InventoryEmptySlot>
            <p className={`m-0 ${displayText} text-xl text-faint`}>
              {emptyLabel}
            </p>
          </InventoryEmptySlot>
        )}
      </div>
    </article>
  );
}
