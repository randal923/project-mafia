import Link from "next/link";

type NavigationItem = {
  badge?: string;
  href: string;
  id: string;
  label: string;
};

type NavigationBarProps = {
  activeItemId?: string;
  ariaLabel?: string;
  brand: string;
  items: readonly NavigationItem[];
};

export function NavigationBar({
  activeItemId,
  ariaLabel = "Primary",
  brand,
  items
}: NavigationBarProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="border-b border-line py-4 md:flex md:items-center md:justify-between md:gap-6"
    >
      <Link
        className="inline-flex items-center gap-3 font-display text-4xl uppercase leading-none tracking-normal text-title"
        href="/"
      >
        <span
          className="h-4 w-4 rotate-45 border-2 border-brass"
          aria-hidden="true"
        />
        {brand}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0 md:justify-end">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-control border px-4 py-2 font-display text-xl uppercase leading-none tracking-normal transition-[background-color,border-color,color] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright ${
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
      </div>
    </nav>
  );
}
