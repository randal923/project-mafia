import { z } from "zod";

export const buyEquipmentRequestSchema = z
  .object({
    equipmentId: z.string().min(1, { error: "equipmentId is required." }),
    quantity: z.number().int().min(1).max(99).optional(),
  })
  .strict();

export type BuyEquipmentRequest = z.infer<typeof buyEquipmentRequestSchema>;

export const sellItemRequestSchema = z
  .object({
    itemId: z.string().min(1, { error: "itemId is required." }),
    quantity: z.number().int().min(1).max(99).optional(),
  })
  .strict();

export type SellItemRequest = z.infer<typeof sellItemRequestSchema>;

export const equipItemRequestSchema = z
  .object({
    itemId: z.string().min(1, { error: "itemId is required." }),
  })
  .strict();

export type EquipItemRequest = z.infer<typeof equipItemRequestSchema>;

export const unequipSlotRequestSchema = z
  .object({
    slot: z.enum(["feet", "hand", "head", "torso", "waist"]),
  })
  .strict();

export type UnequipSlotRequest = z.infer<typeof unequipSlotRequestSchema>;
