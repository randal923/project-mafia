import Image from "next/image";
import { HomeSignInButton } from "./auth/HomeSignInButton";
import { BackdropOverlay } from "./components/BackdropOverlay";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory">
      <Image
        src="/assets/mafia-menu-backdrop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-80"
      />
      <BackdropOverlay />
      <HomeSignInButton />
    </main>
  );
}
