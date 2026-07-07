"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Button } from "../components/Button";
import { getFirebaseClientAuth } from "../firebase/getFirebaseClientAuth";
import { usePlayer } from "../hooks/usePlayer";
import { useAuth } from "./useAuth";

export function AuthStatus() {
  const { isLoading, user } = useAuth();
  const { player } = usePlayer();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut(getFirebaseClientAuth());
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Sign out failed.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <span className="ml-auto text-xs uppercase tracking-widest text-ash">
        Checking
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        className="ml-auto text-xs uppercase tracking-widest text-sulfur transition hover:text-ivory"
        href="/"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-3 text-xs uppercase tracking-widest">
      <span className="max-w-48 truncate text-ash">
        {player?.nickname || "Signed in"}
      </span>
      <Button
        className="py-0 text-xs tracking-widest"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
        variant="ghost"
      >
        {isSigningOut ? "Leaving" : "Sign out"}
      </Button>
      {signOutError ? <span className="text-ivory">{signOutError}</span> : null}
    </div>
  );
}
