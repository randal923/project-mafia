import { AuthGate } from "../auth/AuthGate";
import { PlayerLoadout } from "./components/PlayerLoadout";

export default function PlayerPage() {
  return (
    <main className="h-dvh overflow-hidden bg-player-page px-5 pb-4 pt-19 text-ivory sm:px-8 lg:px-14">
      <AuthGate>
        <PlayerLoadout />
      </AuthGate>
    </main>
  );
}
