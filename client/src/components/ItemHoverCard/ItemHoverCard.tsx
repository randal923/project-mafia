"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import type { PlayerItem } from "@shared/player";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type ItemHoverCardProps = {
  children: ReactNode;
  className?: string;
  item: PlayerItem;
};

type TooltipPosition = {
  left: number;
  /** Render above the anchor when it fits, below when near the viewport top. */
  placement: "above" | "below";
  top: number;
};

const TOOLTIP_GAP = 8;
/** Estimated tooltip height used only to decide above vs below. */
const FLIP_THRESHOLD = 260;

export function ItemHoverCard({
  children,
  className,
  item
}: ItemHoverCardProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const placement = rect.top < FLIP_THRESHOLD ? "below" : "above";
    setPosition({
      left: rect.left + rect.width / 2,
      placement,
      top: placement === "above" ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP
    });
  };

  const hide = () => setPosition(null);

  return (
    <div
      className={cx("group relative", className)}
      onBlur={hide}
      onFocus={show}
      onMouseEnter={show}
      onMouseLeave={hide}
      ref={anchorRef}
      tabIndex={0}
    >
      {children}
      {position ? (
        <div
          className={cx(
            "pointer-events-none fixed z-50 w-44 rounded-panel border border-brass bg-surface p-3 shadow-panel",
            position.placement === "above"
              ? "-translate-x-1/2 -translate-y-full"
              : "-translate-x-1/2"
          )}
          role="tooltip"
          style={{ left: position.left, top: position.top }}
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
          <div className="mt-1 flex flex-wrap justify-center gap-x-3">
            {typeof item.power === "number" && item.power > 0 ? (
              <p className="m-0 text-sm font-medium leading-normal text-brass">
                Power {item.power}
              </p>
            ) : null}
            {typeof item.armor === "number" && item.armor > 0 ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                Armor {item.armor}
              </p>
            ) : null}
            {typeof item.levelRequirement === "number" ? (
              <p className="m-0 text-sm font-medium leading-normal text-faint">
                Lv {item.levelRequirement}
              </p>
            ) : null}
          </div>
          {item.effects?.length ? (
            <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0 text-center">
              {item.effects.map((effect, index) => (
                <li
                  className="text-sm font-medium leading-normal text-brass-bright"
                  key={index}
                >
                  {effect.type === "skillBonus"
                    ? `+${effect.value} ${effect.skill}`
                    : effect.type === "approachBonus"
                      ? `+${effect.value}% ${effect.approach} moves`
                      : `−${effect.value} heat per job`}
                </li>
              ))}
            </ul>
          ) : null}
          {item.detail ? (
            <p className="m-0 mt-2 text-center text-sm leading-normal text-muted">
              {item.detail}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
