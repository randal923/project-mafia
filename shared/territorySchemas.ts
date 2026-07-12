import { z } from "zod";
import {
  FAMILY_COLORS,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_NAME_MIN_LENGTH,
} from "./territory";

export const foundFamilyRequestSchema = z
  .object({
    color: z.enum(FAMILY_COLORS),
    name: z
      .string()
      .trim()
      .min(FAMILY_NAME_MIN_LENGTH, {
        error: `A family name needs at least ${FAMILY_NAME_MIN_LENGTH} characters.`,
      })
      .max(FAMILY_NAME_MAX_LENGTH, {
        error: `A family name fits in ${FAMILY_NAME_MAX_LENGTH} characters.`,
      })
      .regex(/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u, {
        error: "Letters, numbers, spaces, and simple punctuation only.",
      }),
  })
  .strict();

export type FoundFamilyRequest = z.infer<typeof foundFamilyRequestSchema>;

export const claimTurfRequestSchema = z
  .object({
    /** Crew to bring on the takeover job. */
    crewIds: z.array(z.string().min(1)).max(8).optional(),
    turfId: z.string().min(1, { error: "turfId is required." }),
  })
  .strict();

export type ClaimTurfRequest = z.infer<typeof claimTurfRequestSchema>;

export const attackTurfRequestSchema = z
  .object({
    /** Empty = the boss goes alone; his own power carries the assault. */
    crewIds: z.array(z.string().min(1)).max(8),
    turfId: z.string().min(1, { error: "turfId is required." }),
  })
  .strict();

export type AttackTurfRequest = z.infer<typeof attackTurfRequestSchema>;

export const assignTurfCrewRequestSchema = z
  .object({
    crewIds: z.array(z.string().min(1)).max(8),
    turfId: z.string().min(1, { error: "turfId is required." }),
  })
  .strict();

export type AssignTurfCrewRequest = z.infer<typeof assignTurfCrewRequestSchema>;

export const repairTurfRequestSchema = z
  .object({
    turfId: z.string().min(1, { error: "turfId is required." }),
  })
  .strict();

export type RepairTurfRequest = z.infer<typeof repairTurfRequestSchema>;
