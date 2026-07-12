"use client";

import type { CrewArchetypeId } from "@shared/crew";
import type { PlayerLanguage } from "@shared/language";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useLanguage } from "../components/LanguageProvider/LanguageProvider";
import { formatCrewBio } from "./formatCrewBio";
import { formatCrewNameForLocale } from "./formatCrewNameForLocale";

type CrewBiography = {
  archetype: CrewArchetypeId;
  bio: string;
  bioLanguage?: PlayerLanguage;
};

export function useCrewText() {
  const t = useTranslations("catalog");
  const { language } = useLanguage();

  return useMemo(
    () => ({
      crewBio: (crew: CrewBiography) =>
        formatCrewBio(crew, language, (archetype) =>
          t(`crewBios.${archetype}`),
        ),
      crewName: (name: string) =>
        formatCrewNameForLocale(name, (id) => t(`nicknames.${id}`)),
    }),
    [language, t],
  );
}
