import type { Metadata } from "next";
import { ricoVale } from "../../components/CharacterStats/CharacterStatsMocks";
import { CharacterPageContent } from "./CharacterPageContent";
import { loadoutSlots, stashItems } from "./mocks";

export const metadata: Metadata = {
  title: "Character — Project Mafia"
};

export default function CharacterPage() {
  return (
    <CharacterPageContent
      profile={ricoVale}
      slots={loadoutSlots}
      stashItems={stashItems}
    />
  );
}
