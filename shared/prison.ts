import type { Player, PlayerPrison } from "./player";

/** What the cell door looks like from inside: options and their odds. */
export type PrisonStatus = {
  attemptCooldownUntil: string | null;
  bribeChance: number;
  bribeCost: number;
  escapeChance: number;
  prison: PlayerPrison;
};

export type PrisonAttemptResult = {
  player: Player;
  succeeded: boolean;
};
