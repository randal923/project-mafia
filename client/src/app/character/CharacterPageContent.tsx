"use client";

import { CharacterPortrait } from "../../components/CharacterPortrait/CharacterPortrait";
import { CharacterStats } from "../../components/CharacterStats/CharacterStats";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { typography } from "../../design-system/typography";

const defaultPortraitSrc = "/images/characters/gangster-portrait.png";

export function CharacterPageContent() {
  const { player, status } = usePlayer();

  if (status === "loading" || status === "missing") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Pulling your file…</p>
      </div>
    );
  }

  if (status === "error" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>
          Could not reach the family archives. Refresh to try again.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-4">
      <h1 className="sr-only">{player.name} character</h1>
      <CharacterPortrait
        className="mx-auto max-w-56 lg:mx-0"
        image={{
          alt: `${player.name} character portrait`,
          src: player.avatar ?? defaultPortraitSrc
        }}
        name={player.name}
      />
      <CharacterStats className="lg:col-span-3" profile={player} />
    </div>
  );
}
