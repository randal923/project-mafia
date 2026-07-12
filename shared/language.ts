/** Languages the game can be played in (UI and AI narration). */
export const PLAYER_LANGUAGES = ["en", "pt-BR"] as const;

export type PlayerLanguage = (typeof PLAYER_LANGUAGES)[number];

export const DEFAULT_PLAYER_LANGUAGE: PlayerLanguage = "en";
export const PLAYER_LANGUAGE_COOKIE = "project-mafia.language";

export function isPlayerLanguage(value: unknown): value is PlayerLanguage {
  return PLAYER_LANGUAGES.includes(value as PlayerLanguage);
}
