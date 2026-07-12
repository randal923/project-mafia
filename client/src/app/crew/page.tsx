import type { Metadata } from "next";
import { CrewPageContent } from "./CrewPageContent";

export const metadata: Metadata = {
  title: "Crew — Project Mafia"
};

export default function CrewPage() {
  return <CrewPageContent />;
}
