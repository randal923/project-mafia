"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { typography } from "../../design-system/typography";

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const handleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in failed. Try again.");
      setIsSigningIn(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <p className={typography.eyebrow}>Members only</p>
          <h1 className={typography.screenTitle}>Project Mafia</h1>
          <p className={typography.subtitle}>
            Identify yourself before entering the operation.
          </p>
        </div>
        <Button
          onClick={handleSignIn}
          disabled={isSigningIn || isLoading || Boolean(user)}
        >
          {isSigningIn ? "Opening the door…" : "Sign in with Google"}
        </Button>
        {error && <p className={typography.metadata}>{error}</p>}
      </div>
    </main>
  );
}
