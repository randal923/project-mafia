import type { CrewArchetypeId } from "@shared/crew";
import type { PlayerLanguage } from "@shared/language";

type CrewBiography = {
  archetype: CrewArchetypeId;
  bio: string;
  bioLanguage?: PlayerLanguage;
};

export function formatCrewBio(
  crew: CrewBiography,
  language: PlayerLanguage,
  fallback: (archetype: CrewArchetypeId) => string,
): string {
  return (crew.bioLanguage ?? "en") === language
    ? crew.bio
    : fallback(crew.archetype);
}
