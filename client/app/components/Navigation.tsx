"use client";

import Link from "next/link";
import { AuthStatus } from "../auth/AuthStatus";
import { useAuth } from "../auth/useAuth";

export function Navigation() {
  const { isLoading, user } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 sm:px-8 lg:px-14">
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4 text-sm uppercase text-ash">
        <Link
          className="text-base tracking-widest text-sulfur transition hover:text-ivory"
          href="/"
        >
          Project Mafia
        </Link>
        <nav
          aria-label="Main menu"
          className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3 tracking-widest"
        >
          <Link
            className="text-ivory transition hover:text-sulfur"
            href="/player"
          >
            Player
          </Link>
          <Link className="transition hover:text-sulfur" href="/jobs">
            Jobs
          </Link>
        </nav>
        <AuthStatus />
      </div>
    </header>
  );
}
