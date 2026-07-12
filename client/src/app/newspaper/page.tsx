import type { Metadata } from "next";
import { NewspaperPageContent } from "./NewspaperPageContent";

export const metadata: Metadata = {
  title: "The City Ledger — Project Mafia"
};

export default function NewspaperPage() {
  return <NewspaperPageContent />;
}
