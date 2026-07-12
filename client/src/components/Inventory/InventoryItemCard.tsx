import Image from "next/image";
import type { DragEventHandler } from "react";
import {
  toneBorderClasses,
  type BorderTone
} from "../../design-system/tones";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";
import type { InventoryItem, InventoryItemTone } from "./InventoryTypes";

type InventoryItemCardProps = {
  compact?: boolean;
  draggable?: boolean;
  item: InventoryItem;
  onDragEnd?: DragEventHandler<HTMLDivElement>;
  onDragStart?: DragEventHandler<HTMLDivElement>;
};

const toneTokens: Record<InventoryItemTone, BorderTone> = {
  brass: "brass",
  danger: "danger",
  neutral: "line",
  profit: "profit",
  teal: "teal"
};

export function InventoryItemCard({
  compact = false,
  draggable = false,
  item,
  onDragEnd,
  onDragStart
}: InventoryItemCardProps) {
  const { itemName } = useCatalogText();
  const tone = item.tone ?? "neutral";
  const quantityLabel =
    item.quantity !== undefined && item.quantity > 1
      ? `x${item.quantity}`
      : undefined;
  const classNames = cx(
    "relative flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-control border bg-black/40 shadow-command",
    compact ? "p-2" : "p-3",
    draggable && "cursor-grab active:cursor-grabbing",
    toneBorderClasses[toneTokens[tone]]
  );
  const titleClassNames = cx(
    `m-0 flex h-full w-full min-w-0 items-center justify-center break-words text-center ${displayText} text-ink`,
    compact ? "text-lg" : "text-xl"
  );

  return (
    <div
      className={classNames}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      {item.image ? (
        <Image
          alt={item.image.alt}
          className="h-full w-full object-contain drop-shadow"
          height={compact ? 160 : 240}
          src={item.image.src}
          width={compact ? 160 : 240}
        />
      ) : (
        <p className={titleClassNames}>{itemName(item)}</p>
      )}
      {quantityLabel ? (
        <span className="absolute top-2 right-2 rounded-control border border-line bg-page/90 px-2 py-1 text-sm font-medium leading-none text-faint shadow-command">
          {quantityLabel}
        </span>
      ) : null}
    </div>
  );
}
