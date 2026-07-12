import type { Metadata } from "next";
import { MapPageContent } from "./MapPageContent";

export const metadata: Metadata = {
  title: "The City — Project Mafia"
};

export default function MapPage() {
  return <MapPageContent />;
}
