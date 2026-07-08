import Image from "next/image";
import type { ReactNode } from "react";
import type { PlayerItem } from "@shared/player";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type ItemHoverCardProps = {
  children: ReactNode;
  className?: string;
  item: PlayerItem;
};

export function ItemHoverCard({
  children,
  className,
  item
}: ItemHoverCardProps) {
  return (
    <div className={cx("group relative", className)} tabIndex={0}>
      {children}
      <div
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-2 w-44 -translate-x-1/2 rounded-panel border border-brass bg-surface p-3 opacity-0 shadow-panel transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        role="tooltip"
      >
        {item.image ? (
          <Image
            alt={item.image.alt}
            className="mx-auto h-20 w-20 object-contain drop-shadow"
            height={80}
            src={item.image.src}
            width={80}
          />
        ) : null}
        <p className={`m-0 mt-2 text-center ${displayText} text-xl text-ink`}>
          {item.name}
        </p>
        {typeof item.power === "number" ? (
          <p className="m-0 mt-1 text-center text-sm font-medium leading-normal text-brass">
            Power {item.power}
          </p>
        ) : null}
      </div>
    </div>
  );
}
