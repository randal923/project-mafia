import type { Metadata } from "next";
import { typography } from "../../design-system/typography";

export const metadata: Metadata = {
  title: "Jobs — Project Mafia"
};

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className={typography.panelHeading}>Jobs</h1>
      <p className={typography.paragraph}>
        No contracts on the board yet. Check back soon.
      </p>
    </div>
  );
}
