import Image from "next/image";
import type { PlayerItem } from "../lib/playerTypes";

type ItemTileProps = {
  item: PlayerItem;
  isCompact?: boolean;
};

export function ItemTile({ item, isCompact = false }: ItemTileProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex items-center justify-center border border-line bg-obsidian/55 ${
          isCompact ? "h-10" : "h-20"
        }`}
      >
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={item.label}
            width={isCompact ? 150 : 220}
            height={isCompact ? 50 : 74}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <span className="text-xl uppercase tracking-widest text-iron">
            {item.icon}
          </span>
        )}
      </div>
      <p
        className={`truncate uppercase tracking-widest text-ivory ${
          isCompact ? "text-xs" : "text-sm"
        }`}
      >
        {item.label}
      </p>
      <p className="mt-1 truncate text-xs uppercase tracking-widest text-ash">
        {item.detail}
      </p>
    </div>
  );
}
