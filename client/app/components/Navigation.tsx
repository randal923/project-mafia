import Link from "next/link";

export function Navigation() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 sm:px-8 lg:px-14">
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4 text-sm uppercase text-ash">
        <Link
          className="text-base tracking-[0.16em] text-sulfur transition hover:text-ivory"
          href="/"
        >
          Project Mafia
        </Link>
        <nav
          aria-label="Main menu"
          className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3 tracking-[0.14em]"
        >
          <Link className="text-ivory transition hover:text-sulfur" href="/profile">
            Profile
          </Link>
          <Link className="transition hover:text-sulfur" href="/robberies">
            Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
