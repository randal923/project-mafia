"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

export function useFormatters() {
  const locale = useLocale();

  return useMemo(
    () => ({
      dateFormatter: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      moneyFormatter: new Intl.NumberFormat(locale, {
        currency: "USD",
        maximumFractionDigits: 0,
        style: "currency",
      }),
      numberFormatter: new Intl.NumberFormat(locale),
    }),
    [locale],
  );
}
