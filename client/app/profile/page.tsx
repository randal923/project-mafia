import { AuthGate } from "../auth/AuthGate";
import { ProfileLoadout } from "./components/ProfileLoadout";

export default function ProfilePage() {
  return (
    <main className="h-dvh overflow-hidden bg-profile-page px-5 pb-4 pt-19 text-ivory sm:px-8 lg:px-14">
      <AuthGate>
        <ProfileLoadout />
      </AuthGate>
    </main>
  );
}
