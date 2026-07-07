"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Button } from "../components/Button";
import { getFirebaseClientAuth } from "../firebase/getFirebaseClientAuth";
import { useAuth } from "./useAuth";

export function HomeSignInButton() {
  const { isLoading, user } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || user) {
    return null;
  }

  return (
    <section className="relative z-10 flex min-h-dvh items-center justify-start px-5 py-8 sm:px-8 lg:px-16">
      <div className="flex w-full max-w-xs flex-col items-start gap-4">
        {authError ? (
          <p className="w-full border border-blood bg-blood/20 px-3 py-2 text-sm text-ivory">
            {authError}
          </p>
        ) : null}
        <Button
          disabled={isSubmitting}
          fullWidth
          onClick={async () => {
            setAuthError(null);
            setIsSubmitting(true);

            try {
              await signInWithPopup(
                getFirebaseClientAuth(),
                new GoogleAuthProvider(),
              );
            } catch (error) {
              setAuthError(
                error instanceof Error
                  ? error.message
                  : "Google sign in failed.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
          type="button"
        >
          {isSubmitting ? "Opening Google" : "Sign in with Google"}
        </Button>
      </div>
    </section>
  );
}
