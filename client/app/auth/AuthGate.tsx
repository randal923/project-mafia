"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "./useAuth";

type AuthGateProps = {
  children?: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <section className="flex min-h-96 items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-ash">
          Checking access
        </p>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
