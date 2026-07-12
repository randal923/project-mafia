import Link from "next/link";
import type { ReactNode } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Diamond } from "../Diamond/Diamond";

type NavigationItem = {
  badge?: string;
  href: string;
  id: string;
  label: string;
};

type NavigationBarProps = {
  actions?: ReactNode;
  activeItemId?: string;
  ariaLabel: string;
  brand: string;
  items: readonly NavigationItem[];
};

export function NavigationBar({
  actions,
  activeItemId,
  ariaLabel,
  brand,
  items,
}: NavigationBarProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="border-b border-line py-4 md:flex md:items-center md:justify-between md:gap-4"
    >
      <Link
        className={`inline-flex items-center gap-3 ${typography.brandMark}`}
        href="/"
      >
        <Diamond className="border-brass" size="large" />
        {brand}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0 md:justify-end">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-control border px-4 py-2 ${displayText} text-xl transition-[background-color,border-color,color] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright ${
                isActive
                  ? "border-brass bg-brass/10 text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
              href={item.href}
              key={item.id}
            >
              {item.label}
              {item.badge ? (
                <span className="border border-line px-2 py-1 text-base text-brass">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
        {actions}
      </div>
    </nav>
  );
}
