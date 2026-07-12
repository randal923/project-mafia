import type { Metadata } from "next";
import { RankingsPageContent } from "./RankingsPageContent";

export const metadata: Metadata = {
  title: "Rankings — Project Mafia"
};

export default function RankingsPage() {
  return <RankingsPageContent />;
}
