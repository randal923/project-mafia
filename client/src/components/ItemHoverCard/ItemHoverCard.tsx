"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, type ReactNode } from "react";
import type { PlayerItem } from "@shared/player";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";

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
  const t = useTranslations("itemCard");
  const { itemDescription, itemName } = useCatalogText();
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
            {itemName(item)}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3">
            {typeof item.power === "number" && item.power > 0 ? (
              <p className="m-0 text-sm font-medium leading-normal text-brass">
                {t("power", { value: item.power })}
              </p>
            ) : null}
            {typeof item.armor === "number" && item.armor > 0 ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                {t("armor", { value: item.armor })}
              </p>
            ) : null}
            {typeof item.levelRequirement === "number" ? (
              <p className="m-0 text-sm font-medium leading-normal text-faint">
                {t("levelShort", { level: item.levelRequirement })}
              </p>
            ) : null}
            {item.consumable ? (
              <p className="m-0 text-sm font-medium leading-normal text-faint">
                {t("singleUse")}
              </p>
            ) : null}
            {item.use?.stamina ? (
              <p className="m-0 text-sm font-medium leading-normal text-profit">
                {t("use.stamina", { value: item.use.stamina })}
              </p>
            ) : null}
            {item.use?.health ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                {t("use.health", { value: item.use.health })}
              </p>
            ) : null}
            {item.use?.heat ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                {t("use.heat", {
                  value:
                    item.use.heat > 0
                      ? `+${item.use.heat}`
                      : String(item.use.heat)
                })}
              </p>
            ) : null}
            {item.use?.high ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                {t("use.high", { value: item.use.high })}
              </p>
            ) : null}
            {item.use?.drunk ? (
              <p className="m-0 text-sm font-medium leading-normal text-teal">
                {t("use.drunk", { value: item.use.drunk })}
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
                    ? t("effects.skillBonus", {
                        skill: t(`skills.${effect.skill}`),
                        value: effect.value
                      })
                    : effect.type === "approachBonus"
                      ? t("effects.approachBonus", {
                          approach: t(`approaches.${effect.approach}`),
                          value: effect.value
                        })
                      : t("effects.heatReduction", { value: effect.value })}
                </li>
              ))}
            </ul>
          ) : null}
          {item.detail ? (
            <p className="m-0 mt-2 text-center text-sm leading-normal text-muted">
              {itemDescription(item.id, item.detail)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
