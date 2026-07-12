"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { typography } from "../design-system/typography";

export default function NotFound() {
  const t = useTranslations("framework.notFound");

  return (
    <main className="flex min-h-96 items-center justify-center px-6 text-center">
      <div className="flex max-w-lg flex-col items-center gap-4">
        <h1 className={typography.screenTitle}>{t("title")}</h1>
        <p className={typography.paragraph}>{t("body")}</p>
        <Link className="text-brass underline" href="/">
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
