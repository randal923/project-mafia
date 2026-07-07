import { AuthGate } from "../auth/AuthGate";
import { ProfileLoadout } from "./components/ProfileLoadout";

export default function ProfilePage() {
  return (
    <main className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_52%_0%,rgb(169_114_53_/_0.18),transparent_32%),linear-gradient(180deg,var(--charcoal),var(--obsidian)_46%)] px-5 pb-4 pt-[4.75rem] text-ivory sm:px-8 lg:px-14">
      <AuthGate>
        <ProfileLoadout />
      </AuthGate>
    </main>
  );
}
