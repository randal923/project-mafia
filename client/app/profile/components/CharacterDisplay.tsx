import Image from "next/image";

export function CharacterDisplay() {
  return (
    <section className="relative flex h-full min-h-0 items-end justify-center overflow-hidden border border-line bg-obsidian/35">
      <div className="absolute inset-x-10 bottom-8 h-px bg-line" />
      <div className="absolute bottom-6 h-24 w-72 rounded-full bg-black/45 blur-2xl" />
      <Image
        src="/assets/profile/character.png"
        alt="Profile character"
        width={887}
        height={1774}
        priority
        className="relative z-10 h-profile-character max-h-full w-auto object-contain drop-shadow-profile-character"
      />
    </section>
  );
}
