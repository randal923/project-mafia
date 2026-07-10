import type { Metadata } from "next";
import { StorePageContent } from "./StorePageContent";

export const metadata: Metadata = {
  title: "Store — Project Mafia"
};

export default function StorePage() {
  return <StorePageContent />;
}
