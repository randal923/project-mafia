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
  teal: "border-teal"
};

const toneTextClasses: Record<InventoryItemTone, string> = {
  brass: "text-brass-bright",
  danger: "text-danger-strong",
  neutral: "text-muted",
  profit: "text-profit",
  teal: "text-teal"
};

export function InventoryItemCard({
  compact = false,
  item
}: InventoryItemCardProps) {
  const tone = item.tone ?? "neutral";
  const classNames = [
    "flex h-full min-w-0 flex-col justify-between rounded-control border bg-black/40 p-3 shadow-command",
    toneBorderClasses[tone]
  ].join(" ");
  const titleClassNames = [
    "m-0 min-w-0 break-words font-display uppercase leading-none tracking-normal text-ink",
    compact ? "text-lg" : "text-xl"
  ].join(" ");

  return (
    <div className={classNames}>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={titleClassNames}>{item.name}</p>
          {item.quantityLabel ? (
            <span className="shrink-0 rounded-control border border-line px-2 py-1 text-sm font-medium leading-none text-faint">
              {item.quantityLabel}
            </span>
          ) : null}
        </div>
        <p
          className={`mt-2 mb-0 font-display text-lg uppercase leading-none tracking-normal ${toneTextClasses[tone]}`}
        >
          {item.category}
        </p>
      </div>
      {item.detail && !compact ? (
        <p className="mt-4 mb-0 text-sm leading-relaxed text-muted">
          {item.detail}
        </p>
      ) : null}
    </div>
  );
}
