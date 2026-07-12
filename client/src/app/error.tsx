"use client";

import { useTranslations } from "next-intl";
import { Button } from "../components/Button/Button";
import { typography } from "../design-system/typography";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ reset }: AppErrorProps) {
  const t = useTranslations("framework.error");

  return (
    <main className="flex min-h-96 items-center justify-center px-6 text-center">
      <div className="flex max-w-lg flex-col items-center gap-4">
        <h1 className={typography.screenTitle}>{t("title")}</h1>
        <p className={typography.paragraph}>{t("body")}</p>
        <Button onClick={reset}>{t("retry")}</Button>
      </div>
    </main>
  );
}
