import { JobsBoard } from "./components/JobsBoard";

export default function RobberiesPage() {
  return (
    <main className="min-h-dvh overflow-auto bg-[radial-gradient(circle_at_50%_0%,rgb(169_114_53_/_0.18),transparent_30%),linear-gradient(180deg,var(--charcoal),var(--obsidian)_54%)] px-4 pb-5 pt-[5.25rem] text-ivory sm:px-8 lg:px-14">
      <JobsBoard />
    </main>
  );
}
