"use client";

import type { PlayerNotification } from "@shared/notification";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { useCatalogText } from "./useCatalogText";
import { useCrewText } from "./useCrewText";
import { formatNotificationText } from "./formatNotificationText";

export function useNotificationText() {
  const locale = useLocale();
  const t = useTranslations("notificationContent");
  const { buildingNameById, turfName } = useCatalogText();
  const { crewName } = useCrewText();

  return useCallback(
    (notification: PlayerNotification) =>
      formatNotificationText(notification, {
        buildingName: buildingNameById,
        crewName,
        language: locale === "pt-BR" ? "pt-BR" : "en",
        translate: t,
        turfName,
      }),
    [buildingNameById, crewName, locale, t, turfName],
  );
}
