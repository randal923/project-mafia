import type { Metadata } from "next";
import { JobsPageContent } from "./JobsPageContent";

export const metadata: Metadata = {
  title: "Jobs — Project Mafia"
};

export default function JobsPage() {
  return <JobsPageContent />;
}
