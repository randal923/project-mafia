import type { AriaRole, ReactNode } from "react";

type FrameElement = "article" | "div" | "section";
type FrameHeaderIcon = "diamond";
type FrameTopBorderColor =
  | "brass"
  | "brassBright"
  | "danger"
  | "line"
  | "profit"
  | "teal";

type FrameProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  element?: FrameElement;
  headerDismissLabel?: string;
  headerIcon?: FrameHeaderIcon;
  headerLabel?: string;
  headerTitle?: string;
  onHeaderDismiss?: () => void;
  role?: AriaRole;
  topBorderColor?: FrameTopBorderColor;
  withHeader?: boolean;
};

const topBorderColorClasses: Record<FrameTopBorderColor, string> = {
  brass: "border-t-brass",
  brassBright: "border-t-brass-bright",
  danger: "border-t-danger-strong",
  line: "border-t-line",
  profit: "border-t-profit",
  teal: "border-t-teal"
};

const headerTitleClasses = {
  compact:
    "m-0 font-display text-2xl uppercase leading-none tracking-normal text-current",
  stacked:
    "mt-2 mb-0 font-display text-3xl uppercase leading-none tracking-normal text-title"
};

export function Frame({
  ariaLabel,
  children,
  className,
  element: Element = "div",
  headerDismissLabel = "Dismiss",
  headerIcon,
  headerLabel,
  headerTitle,
  onHeaderDismiss,
  role,
  topBorderColor = "line",
  withHeader = false
}: FrameProps) {
  const classNames = [
    "rounded-panel border border-t-2 border-line bg-surface p-4",
    topBorderColorClasses[topBorderColor],
    className
  ]
    .filter(Boolean)
    .join(" ");
  const shouldShowHeader =
    withHeader &&
    Boolean(headerIcon || headerLabel || headerTitle || onHeaderDismiss);
  const titleClasses = headerLabel
    ? headerTitleClasses.stacked
    : headerTitleClasses.compact;
  const HeaderTitleElement = headerLabel ? "h2" : "p";

  return (
    <Element aria-label={ariaLabel} className={classNames} role={role}>
      {shouldShowHeader ? (
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-line pb-3">
          <div>
            {headerLabel ? (
              <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-current">
                {headerLabel}
              </p>
            ) : null}
            {headerTitle ? (
              <HeaderTitleElement className={titleClasses}>
                {headerTitle}
              </HeaderTitleElement>
            ) : null}
          </div>
          {headerIcon === "diamond" ? (
            <span
              className="h-2 w-2 rotate-45 border border-current"
              aria-hidden="true"
            />
          ) : null}
          {onHeaderDismiss ? (
            <button
              aria-label={headerDismissLabel}
              className="min-h-8 min-w-8 cursor-pointer rounded-control border border-line bg-transparent font-display text-xl uppercase leading-none tracking-normal text-muted transition-[border-color,color] duration-150 hover:border-brass hover:text-ink focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright"
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
