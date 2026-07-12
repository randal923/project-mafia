import { z } from "zod";
import { CREW_SLOT_IDS } from "./crew";

export const hireCrewRequestSchema = z
  .object({
    candidateId: z.string().min(1, { error: "candidateId is required." }),
  })
  .strict();

export type HireCrewRequest = z.infer<typeof hireCrewRequestSchema>;

export const fireCrewRequestSchema = z
  .object({
    memberId: z.string().min(1, { error: "memberId is required." }),
  })
  .strict();

export type FireCrewRequest = z.infer<typeof fireCrewRequestSchema>;

export const trainCrewRequestSchema = z
  .object({
    memberId: z.string().min(1, { error: "memberId is required." }),
  })
  .strict();

export type TrainCrewRequest = z.infer<typeof trainCrewRequestSchema>;

export const bribeCrewRequestSchema = z
  .object({
    memberId: z.string().min(1, { error: "memberId is required." }),
  })
  .strict();

export type BribeCrewRequest = z.infer<typeof bribeCrewRequestSchema>;

export const equipCrewRequestSchema = z
  .object({
    itemId: z.string().min(1, { error: "itemId is required." }),
    memberId: z.string().min(1, { error: "memberId is required." }),
  })
  .strict();

export type EquipCrewRequest = z.infer<typeof equipCrewRequestSchema>;

export const unequipCrewRequestSchema = z
  .object({
    memberId: z.string().min(1, { error: "memberId is required." }),
    slot: z.enum(CREW_SLOT_IDS),
  })
  .strict();

export type UnequipCrewRequest = z.infer<typeof unequipCrewRequestSchema>;
