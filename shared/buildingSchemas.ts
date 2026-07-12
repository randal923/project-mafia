import { z } from "zod";

export const buyPersonalBuildingRequestSchema = z
  .object({
    definitionId: z.string().min(1, { error: "definitionId is required." }),
  })
  .strict();

export type BuyPersonalBuildingRequest = z.infer<
  typeof buyPersonalBuildingRequestSchema
>;

export const buildRacketRequestSchema = z
  .object({
    definitionId: z.string().min(1, { error: "definitionId is required." }),
    turfId: z.string().min(1, { error: "turfId is required." }),
  })
  .strict();

export type BuildRacketRequest = z.infer<typeof buildRacketRequestSchema>;

/** Targets a personal holding (no turfId) or a racket on a turf. */
export const buildingTargetRequestSchema = z
  .object({
    buildingId: z.string().min(1, { error: "buildingId is required." }),
    turfId: z.string().min(1).optional(),
  })
  .strict();

export type BuildingTargetRequest = z.infer<typeof buildingTargetRequestSchema>;

export const staffBuildingRequestSchema = z
  .object({
    buildingId: z.string().min(1, { error: "buildingId is required." }),
    crewIds: z.array(z.string().min(1)).max(3),
    turfId: z.string().min(1).optional(),
  })
  .strict();

export type StaffBuildingRequest = z.infer<typeof staffBuildingRequestSchema>;
