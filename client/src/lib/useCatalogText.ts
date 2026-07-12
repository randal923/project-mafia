"use client";

import {
  type CrewArchetypeId,
  type CrewTier,
  type CrewTraitId
} from "@shared/crew";
import { districtIdForLabel, type DistrictId } from "@shared/district";
import type { JobApproach } from "@shared/job";
import type { PlayerRank } from "@shared/player";
import type { SkillId } from "@shared/skills";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

type Named = { id: string; name: string };

/**
 * Translated display text for static catalog content (equipment items and
 * buildings), keyed by id under the "catalog" messages namespace. Entries
 * missing from the messages use localized generic copy in Portuguese while
 * English preserves the server-provided label when one is available.
 */
export function useCatalogText() {
  const t = useTranslations("catalog");
  const locale = useLocale();

  return useMemo(
    () => ({
      approachName: (id: JobApproach) => t(`approaches.${id}`),
      archetypeDescription: (id: CrewArchetypeId) =>
        t(`archetypes.${id}.description`),
      archetypeName: (id: CrewArchetypeId) => t(`archetypes.${id}.name`),
      buildingDescription: (id: string, fallback: string) =>
        t.has(`buildings.${id}.description`)
          ? t(`buildings.${id}.description`)
          : locale === "en"
            ? fallback
            : t("buildings.unknown.description"),
      buildingName: ({ id, name }: Named) =>
        t.has(`buildings.${id}.name`)
          ? t(`buildings.${id}.name`)
          : locale === "en"
            ? name
            : t("buildings.unknown.name"),
      buildingNameById: (id: string) =>
        t.has(`buildings.${id}.name`)
          ? t(`buildings.${id}.name`)
          : t("buildings.unknown.name"),
      districtDescription: (id: DistrictId) =>
        t(`districts.${id}.description`),
      districtName: (id: DistrictId) => t(`districts.${id}.name`),
      /** For mission templates' free-form district labels ("The Docks"). */
      districtNameForLabel: (label: string) => {
        const id = districtIdForLabel(label);
        return id
          ? t(`districts.${id}.name`)
          : locale === "en"
            ? label
            : t("districts.unknown.name");
      },
      itemDescription: (id: string, fallback: string) =>
        t.has(`items.${id}.description`)
          ? t(`items.${id}.description`)
          : locale === "en"
            ? fallback
            : t("items.unknown.description"),
      itemName: ({ id, name }: Named) =>
        t.has(`items.${id}.name`)
          ? t(`items.${id}.name`)
          : locale === "en"
            ? name
            : t("items.unknown.name"),
      itemNameById: (id: string) =>
        t.has(`items.${id}.name`)
          ? t(`items.${id}.name`)
          : t("items.unknown.name"),
      rankName: (id: PlayerRank) => t(`ranks.${id}`),
      skillDescription: (id: SkillId) => t(`skills.${id}.description`),
      skillName: (id: SkillId) => t(`skills.${id}.name`),
      tierName: (tier: CrewTier) => t(`tiers.${tier}`),
      traitDescription: (id: CrewTraitId) => t(`traits.${id}.description`),
      traitName: (id: CrewTraitId) => t(`traits.${id}.name`),
      turfName: (id: string) =>
        t.has(`turfs.${id}`) ? t(`turfs.${id}`) : t("turfs.unknown")
    }),
    [locale, t]
  );
}
