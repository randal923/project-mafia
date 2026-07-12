"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import { typography } from "../../design-system/typography";

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("login");

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
      setError(t("error"));
      setIsSigningIn(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <p className={typography.eyebrow}>{t("eyebrow")}</p>
          <h1 className={typography.screenTitle}>Project Mafia</h1>
          <p className={typography.subtitle}>{t("subtitle")}</p>
        </div>
        <Button
          onClick={handleSignIn}
          disabled={isSigningIn || isLoading || Boolean(user)}
        >
          {isSigningIn ? t("signingIn") : t("signIn")}
        </Button>
        {error && <p className={typography.metadata}>{error}</p>}
        <LanguageSwitcher />
      </div>
    </main>
  );
}
