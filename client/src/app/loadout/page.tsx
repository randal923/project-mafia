import type { Metadata } from "next";
import { LoadoutPageContent } from "./LoadoutPageContent";

export const metadata: Metadata = {
  title: "Loadout — Project Mafia"
};

export default function LoadoutPage() {
  return <LoadoutPageContent />;
}
