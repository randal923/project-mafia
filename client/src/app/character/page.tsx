import type { Metadata } from "next";
import { CharacterPageContent } from "./CharacterPageContent";

export const metadata: Metadata = {
  title: "Character — Project Mafia"
};

export default function CharacterPage() {
  return <CharacterPageContent />;
}
