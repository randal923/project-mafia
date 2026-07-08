import type { Metadata } from "next";
import { ricoVale } from "../../components/CharacterStats/CharacterStatsMocks";
import { NavigationBar } from "../../components/NavigationBar/NavigationBar";
import { CharacterPageContent } from "./CharacterPageContent";
import { loadoutSlots, stashItems } from "./mocks";

export const metadata: Metadata = {
  title: "Character — Project Mafia"
};

const navigationItems = [
  { href: "/", id: "operations", label: "Operations" },
  { href: "/character", id: "character", label: "Character" },
  { href: "/", id: "districts", label: "Districts" },
  { href: "/", id: "crew", label: "Crew" }
];

export default function CharacterPage() {
  return (
    <main className="flex min-h-screen flex-col bg-page px-6 pb-6 text-ink lg:h-screen">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <NavigationBar
          activeItemId="character"
          brand="Project Mafia"
          items={navigationItems}
        />
        <div className="mt-8 min-h-0 flex-1">
          <CharacterPageContent
            profile={ricoVale}
            slots={loadoutSlots}
            stashItems={stashItems}
          />
        </div>
      </div>
    </main>
  );
}
