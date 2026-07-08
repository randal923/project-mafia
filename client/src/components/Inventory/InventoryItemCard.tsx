import Image from "next/image";
import type { InventoryItem, InventoryItemTone } from "./InventoryTypes";

type InventoryItemCardProps = {
  compact?: boolean;
  item: InventoryItem;
};

const toneBorderClasses: Record<InventoryItemTone, string> = {
  brass: "border-brass",
  danger: "border-danger-strong",
  neutral: "border-line",
  profit: "border-profit",
  teal: "border-teal",
};

export function InventoryItemCard({
  compact = false,
  item,
}: InventoryItemCardProps) {
  const tone = item.tone ?? "neutral";
  const classNames = [
    "relative flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-control border bg-black/40 p-3 shadow-command",
    toneBorderClasses[tone],
  ].join(" ");
  const titleClassNames = [
    "m-0 flex h-full w-full min-w-0 items-center justify-center break-words text-center font-display uppercase leading-none tracking-normal text-ink",
    compact ? "text-lg" : "text-xl",
  ].join(" ");
  const imageClassNames = [
    "h-full w-full object-contain drop-shadow",
  ].join(" ");

  return (
    <div className={classNames}>
      {item.image ? (
        <Image
          alt={item.image.alt}
          className={imageClassNames}
          height={compact ? 160 : 240}
          src={item.image.src}
          width={compact ? 160 : 240}
        />
      ) : (
        <p className={titleClassNames}>{item.name}</p>
      )}
      {item.quantityLabel ? (
        <span className="absolute top-2 right-2 rounded-control border border-line bg-page/90 px-2 py-1 text-sm font-medium leading-none text-faint shadow-command">
          {item.quantityLabel}
        </span>
      ) : null}
    </div>
  );
}
