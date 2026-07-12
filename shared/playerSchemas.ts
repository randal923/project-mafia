import { z } from "zod";
import { PLAYER_LANGUAGES } from "./language";

export const playerLanguageSchema = z.enum(PLAYER_LANGUAGES);

export const PLAYER_NAME_MIN_LENGTH = 3;
export const PLAYER_NAME_MAX_LENGTH = 20;

/**
 * Sanitizes and validates a player name: trims, collapses inner whitespace,
 * and only allows letters, digits, spaces, hyphens, and apostrophes.
 */
export const playerNameSchema = z
  .string({ error: "Name is required." })
  .trim()
  .transform((value) => value.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(PLAYER_NAME_MIN_LENGTH, {
        error: `Name must be at least ${PLAYER_NAME_MIN_LENGTH} characters.`
      })
      .max(PLAYER_NAME_MAX_LENGTH, {
        error: `Name must be at most ${PLAYER_NAME_MAX_LENGTH} characters.`
      })
      .regex(/^[\p{L}\p{N}][\p{L}\p{N} '-]*$/u, {
        error:
          "Name can only contain letters, numbers, spaces, hyphens, and apostrophes."
      })
  );

export const createPlayerRequestSchema = z
  .object({
    language: playerLanguageSchema.optional(),
    name: playerNameSchema
  })
  .strict();

export type CreatePlayerRequest = z.infer<typeof createPlayerRequestSchema>;

export const updatePlayerLanguageRequestSchema = z
  .object({
    language: playerLanguageSchema
  })
  .strict();

export type UpdatePlayerLanguageRequest = z.infer<
  typeof updatePlayerLanguageRequestSchema
>;

/** Canonical key used to enforce case-insensitive name uniqueness. */
export function playerNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
