"use client";

import { useRef, useState, type ReactNode } from "react";
import { cx } from "../../lib/cx";

type HoverTipProps = {
  children: ReactNode;
  className?: string;
  tip: string;
};

const GAP = 8;
const FLIP_THRESHOLD = 140;

/**
 * A small fixed-position text tooltip that escapes overflow containers
 * (same positioning approach as ItemHoverCard).
 */
export function HoverTip({ children, className, tip }: HoverTipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    placement: "above" | "below";
    top: number;
  } | null>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const placement = rect.top < FLIP_THRESHOLD ? "below" : "above";
    setPosition({
      left: rect.left + rect.width / 2,
      placement,
      top: placement === "above" ? rect.top - GAP : rect.bottom + GAP
    });
  };

  const hide = () => setPosition(null);

  return (
    <span
      className={cx("cursor-help", className)}
      onBlur={hide}
      onFocus={show}
      onMouseEnter={show}
      onMouseLeave={hide}
      ref={anchorRef}
      tabIndex={0}
    >
      {children}
      {position ? (
        <span
          className={cx(
            "pointer-events-none fixed z-50 block w-56 rounded-panel border border-brass bg-surface p-3 text-sm font-medium leading-normal normal-case tracking-normal text-muted shadow-panel",
            position.placement === "above"
              ? "-translate-x-1/2 -translate-y-full"
              : "-translate-x-1/2"
          )}
          role="tooltip"
          style={{ left: position.left, top: position.top }}
        >
          {tip}
        </span>
      ) : null}
    </span>
  );
}
