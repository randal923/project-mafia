"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { typography } from "../../design-system/typography";
import { useAuth } from "../AuthProvider/AuthProvider";

const publicPaths = ["/login"];

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = publicPaths.includes(pathname);
  const t = useTranslations("authGuard");

  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublicPath, router]);

  if (isPublicPath) {
    return children;
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page">
        <p className={typography.metadata}>{t("verifying")}</p>
      </main>
    );
  }

  return children;
}
