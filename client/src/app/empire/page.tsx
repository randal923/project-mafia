import type { Metadata } from "next";
import { EmpirePageContent } from "./EmpirePageContent";

export const metadata: Metadata = {
  title: "Empire — Project Mafia"
};

export default function EmpirePage() {
  return <EmpirePageContent />;
}
