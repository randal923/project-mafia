"use client";

import {
  CREW_ARCHETYPES,
  CREW_TIER_LABELS,
  CREW_TRAITS,
  type CrewArchetypeId,
  type CrewTier,
  type CrewTraitId
} from "@shared/crew";
import { DISTRICTS, districtIdForLabel, type DistrictId } from "@shared/district";
import type { PlayerRank } from "@shared/player";
import { SKILLS, type SkillId } from "@shared/skills";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Named = { id: string; name: string };

/**
 * Translated display text for static catalog content (equipment items and
 * buildings), keyed by id under the "catalog" messages namespace. Entries
 * missing from the messages fall back to the server-provided text, so new
 * catalog content ships before its translation exists.
 */
export function useCatalogText() {
  const t = useTranslations("catalog");

  return useMemo(
    () => ({
      archetypeName: (id: CrewArchetypeId) =>
        t.has(`archetypes.${id}`)
          ? t(`archetypes.${id}`)
          : CREW_ARCHETYPES[id].label,
      buildingDescription: (id: string, fallback: string) =>
        t.has(`buildings.${id}.description`)
          ? t(`buildings.${id}.description`)
          : fallback,
      buildingName: ({ id, name }: Named) =>
        t.has(`buildings.${id}.name`) ? t(`buildings.${id}.name`) : name,
      districtName: (id: DistrictId) =>
        t.has(`districts.${id}`) ? t(`districts.${id}`) : DISTRICTS[id].label,
      /** For mission templates' free-form district labels ("The Docks"). */
      districtNameForLabel: (label: string) => {
        const id = districtIdForLabel(label);
        return id && t.has(`districts.${id}`) ? t(`districts.${id}`) : label;
      },
      itemDescription: (id: string, fallback: string) =>
        t.has(`items.${id}.description`)
          ? t(`items.${id}.description`)
          : fallback,
      itemName: ({ id, name }: Named) =>
        t.has(`items.${id}.name`) ? t(`items.${id}.name`) : name,
      rankName: (id: PlayerRank) =>
        t.has(`ranks.${id}`) ? t(`ranks.${id}`) : id.replace(/_/g, " "),
      skillName: (id: SkillId) =>
        t.has(`skills.${id}`) ? t(`skills.${id}`) : SKILLS[id].label,
      tierName: (tier: CrewTier) =>
        t.has(`tiers.${tier}`) ? t(`tiers.${tier}`) : CREW_TIER_LABELS[tier],
      traitName: (id: CrewTraitId) =>
        t.has(`traits.${id}`) ? t(`traits.${id}`) : CREW_TRAITS[id].label
    }),
    [t]
  );
}
