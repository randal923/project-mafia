"use client";

import { useTranslations } from "next-intl";
import type { AriaRole, ReactNode } from "react";
import {
  toneTopBorderClasses,
  type TopBorderTone
} from "../../design-system/tones";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Diamond } from "../Diamond/Diamond";

type FrameElement = "article" | "div" | "section";
type FrameHeaderIcon = "diamond";
type FramePadding = "medium" | "large";
type FrameSurface = "base" | "raised";

type FrameProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  element?: FrameElement;
  headerAside?: ReactNode;
  headerDismissLabel?: string;
  headerIcon?: FrameHeaderIcon;
  headerLabel?: string;
  headerTitle?: string;
  onHeaderDismiss?: () => void;
  padding?: FramePadding;
  role?: AriaRole;
  surface?: FrameSurface;
  topBorderColor?: TopBorderTone;
  withHeader?: boolean;
};

const paddingClasses: Record<FramePadding, string> = {
  large: "p-6",
  medium: "p-4"
};

const surfaceClasses: Record<FrameSurface, string> = {
  base: "bg-surface",
  raised: "bg-surface-raised"
};

const headerTitleClasses = {
  compact: `m-0 ${displayText} text-2xl text-current`,
  stacked: `mt-2 mb-0 ${typography.panelHeading}`
};

export function Frame({
  ariaLabel,
  children,
  className,
  element: Element = "div",
  headerAside,
  headerDismissLabel,
  headerIcon,
  headerLabel,
  headerTitle,
  onHeaderDismiss,
  padding = "medium",
  role,
  surface = "base",
  topBorderColor = "line",
  withHeader = false
}: FrameProps) {
  const t = useTranslations("common");
  const classNames = cx(
    "rounded-panel border border-t-2 border-line",
    surfaceClasses[surface],
    paddingClasses[padding],
    toneTopBorderClasses[topBorderColor],
    className
  );
  const shouldShowHeader =
    withHeader &&
    Boolean(
      headerAside || headerIcon || headerLabel || headerTitle || onHeaderDismiss
    );
  const titleClasses = headerLabel
    ? headerTitleClasses.stacked
    : headerTitleClasses.compact;
  const HeaderTitleElement = headerLabel ? "h2" : "p";

  return (
    <Element aria-label={ariaLabel} className={classNames} role={role}>
      {shouldShowHeader ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
          <div>
            {headerLabel ? (
              <p className={`m-0 ${displayText} text-xl text-current`}>
                {headerLabel}
              </p>
            ) : null}
            {headerTitle ? (
              <HeaderTitleElement className={titleClasses}>
                {headerTitle}
              </HeaderTitleElement>
            ) : null}
          </div>
          {headerAside}
          {headerIcon === "diamond" ? (
            <Diamond className="border-current" />
          ) : null}
          {onHeaderDismiss ? (
            <button
              aria-label={headerDismissLabel ?? t("dismiss")}
              className={`min-h-8 min-w-8 cursor-pointer rounded-control border border-line bg-transparent ${displayText} text-xl text-muted transition-[border-color,color] duration-150 hover:border-brass hover:text-ink focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright`}
              onClick={onHeaderDismiss}
              type="button"
            >
              X
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </Element>
  );
}
