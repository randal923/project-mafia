import { AuthGate } from "../auth/AuthGate";
import { JobsBoard } from "./components/JobsBoard";

export default function JobsPage() {
  return (
    <main className="min-h-dvh overflow-auto bg-player-page px-4 pb-5 pt-21 text-ivory sm:px-8 lg:px-14">
      <AuthGate>
        <JobsBoard />
      </AuthGate>
    </main>
  );
}
