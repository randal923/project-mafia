import type { DragEvent } from "react";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { ItemHoverCard } from "../ItemHoverCard/ItemHoverCard";
import { InventoryEmptySlot } from "./InventoryEmptySlot";
import { InventoryItemCard } from "./InventoryItemCard";
import type { InventorySlot, InventorySlotId } from "./InventoryTypes";

type InventorySlotPanelProps = {
  actionsDisabled?: boolean;
  emptyLabel: string;
  onItemDragEnd?: () => void;
  onItemDragStart?: (
    event: DragEvent<HTMLDivElement>,
    slot: InventorySlot
  ) => void;
  onUnequip?: (slotId: InventorySlotId) => void;
  placementClassName: string;
  slot: InventorySlot;
};

export function InventorySlotPanel({
  actionsDisabled = false,
  emptyLabel,
  onItemDragEnd,
  onItemDragStart,
  onUnequip,
  placementClassName,
  slot
}: InventorySlotPanelProps) {
  const classNames = cx(
    "relative z-10 min-h-28 rounded-panel border bg-surface-raised p-2",
    slot.item ? "border-brass" : "border-line",
    placementClassName
  );
  const ariaLabel = slot.item
    ? `${slot.label} slot equipped with ${slot.item.name}`
    : `${slot.label} slot empty`;

  return (
    <article aria-label={ariaLabel} className={cx(classNames, "flex flex-col")}>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
        <h3 className={`m-0 ${displayText} text-lg text-muted`}>
          {slot.label}
        </h3>
        <span className={`${displayText} text-base text-brass`}>Slot</span>
      </div>
      <div className="mt-2 flex items-center justify-center border border-line bg-page p-1">
        {slot.item ? (
          <ItemHoverCard className="w-full" item={slot.item}>
            <InventoryItemCard
              compact
              draggable={!actionsDisabled && Boolean(onItemDragStart)}
              item={slot.item}
              onDragEnd={onItemDragEnd}
              onDragStart={(event) => onItemDragStart?.(event, slot)}
            />
          </ItemHoverCard>
        ) : (
          <InventoryEmptySlot>
            <p className={`m-0 ${displayText} text-lg text-faint`}>
              {emptyLabel}
            </p>
          </InventoryEmptySlot>
        )}
      </div>
      <div className="mt-2 min-h-10">
        {slot.item && onUnequip ? (
          <Button
            className="w-full"
            disabled={actionsDisabled}
            onClick={() => onUnequip(slot.id)}
            size="small"
            variant="quiet"
          >
            Unequip
          </Button>
        ) : null}
      </div>
    </article>
  );
}
