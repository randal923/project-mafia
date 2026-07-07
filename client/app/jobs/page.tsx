import { AuthGate } from "../auth/AuthGate";

export default function JobsPage() {
  return (
    <main className="min-h-dvh overflow-auto px-4 pb-5 pt-21 text-ivory sm:px-8 lg:px-14">
      <AuthGate />
    </main>
  );
}
