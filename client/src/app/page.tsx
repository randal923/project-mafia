import type { Metadata } from "next";
import { HomePageContent } from "./HomePageContent";

export const metadata: Metadata = {
  title: "News — Project Mafia"
};

export default function Home() {
  return <HomePageContent />;
}
