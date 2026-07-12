import { z } from "zod";
import { JOB_APPROACHES } from "./job";
import { EquipmentSlotId, PlayerItem, PlayerItemTone } from "./player";
import { SKILL_IDS } from "./skills";

export const EQUIPMENT_CATEGORIES = [
  "melee",
  "pistol",
  "smg",
  "shotgun",
  "rifle",
  "sniper",
  "machine_gun",
  "explosive",
  "armor",
  "headgear",
  "footwear",
  "utility",
  "tool",
  "drug",
  "alcohol",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  alcohol: "Liquor",
  armor: "Body Armor",
  drug: "Narcotics",
  explosive: "Explosives",
  footwear: "Footwear",
  headgear: "Headgear",
  machine_gun: "Machine Guns",
  melee: "Melee",
  pistol: "Pistols",
  rifle: "Rifles",
  shotgun: "Shotguns",
  smg: "SMGs",
  sniper: "Sniper Rifles",
  tool: "Tools",
  utility: "Utility",
};

/** Passive bonuses granted while the item is equipped in the loadout. */
export const equipmentEffectSchema = z.discriminatedUnion("type", [
  z
    .object({
      skill: z.enum(SKILL_IDS),
      type: z.literal("skillBonus"),
      value: z.number(),
    })
    .strict(),
  z
    .object({
      approach: z.enum(JOB_APPROACHES),
      type: z.literal("approachBonus"),
      value: z.number(),
    })
    .strict(),
  z
    .object({
      type: z.literal("heatReduction"),
      value: z.number().min(0),
    })
    .strict(),
]);

export type EquipmentEffect = z.infer<typeof equipmentEffectSchema>;

export const equipmentSchema = z
  .object({
    /** Damage soak applied to failed risky mission choices. */
    armor: z.number().min(0).optional(),
    category: z.enum(EQUIPMENT_CATEGORIES),
    /** Consumables stack in the stash and are spent on use or by mission gear. */
    consumable: z.boolean().optional(),
    description: z.string().min(1),
    effects: z.array(equipmentEffectSchema).optional(),
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/),
    image: z
      .object({
        alt: z.string().min(1),
        src: z.string().min(1),
      })
      .strict(),
    levelRequirement: z.number().int().min(1).max(100),
    name: z.string().min(1),
    power: z.number().min(0),
    price: z.number().int().min(0),
    /** null = stash-only; otherwise the loadout slot. */
    slot: z.enum(["feet", "hand", "head", "torso", "waist"]).nullable(),
    tags: z.array(z.string().min(1)).optional(),
    /**
     * What USING the item from the stash does (kits, drugs, liquor). Consumes
     * one. stamina restores (clamped to 100); heat is a delta — positive
     * for risky highs, negative for sedatives that keep you off the street.
     */
    use: z
      .object({
        /** How much drunker this makes you (alcohol). */
        drunk: z.number().int().min(0).optional(),
        /** Health restored immediately, clamped to the player maximum. */
        health: z.number().int().min(0).optional(),
        heat: z.number().int().optional(),
        /** How much higher this gets you (drugs). */
        high: z.number().int().min(0).optional(),
        stamina: z.number().int().min(0).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((equipment, context) => {
    if (
      equipment.category === "tool" &&
      equipment.slot === null &&
      equipment.consumable !== true
    ) {
      context.addIssue({
        code: "custom",
        message: "Stash-only tools must be consumable.",
        path: ["consumable"],
      });
    }

    if (equipment.use && equipment.tags?.length) {
      context.addIssue({
        code: "custom",
        message: "Active-use items cannot also satisfy mission gear demands.",
        path: ["tags"],
      });
    }

    if (
      equipment.slot !== null &&
      equipment.slot !== "hand" &&
      (equipment.armor === undefined ||
        equipment.armor <= 0 ||
        equipment.power <= 0)
    ) {
      context.addIssue({
        code: "custom",
        message: `${equipment.slot} equipment must define positive power and armor.`,
        path: ["armor"],
      });
    }

    if (
      equipment.slot !== null &&
      equipment.slot !== "hand" &&
      equipment.consumable === true
    ) {
      context.addIssue({
        code: "custom",
        message: "Equippable gear cannot be consumable.",
        path: ["consumable"],
      });
    }

    if (
      equipment.slot === "hand" &&
      (equipment.power <= 0 ||
        equipment.armor !== undefined ||
        equipment.consumable !== undefined ||
        equipment.effects !== undefined ||
        equipment.tags !== undefined ||
        equipment.use !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Hand weapons require positive power and cannot define armor, consumable behavior, effects, tags, or use effects.",
      });
    }
  });

export type Equipment = z.infer<typeof equipmentSchema>;

export const equipmentCatalogSchema = z.array(equipmentSchema);

export const STARTER_EQUIPMENT_ID = "stiletto-knife";

const CATEGORY_TONES: Record<EquipmentCategory, PlayerItemTone> = {
  alcohol: "brass",
  armor: "teal",
  drug: "profit",
  explosive: "danger",
  footwear: "neutral",
  headgear: "neutral",
  machine_gun: "danger",
  melee: "neutral",
  pistol: "danger",
  rifle: "danger",
  shotgun: "danger",
  smg: "danger",
  sniper: "danger",
  tool: "brass",
  utility: "profit",
};

export function equipmentToPlayerItem(
  equipment: Equipment,
  quantity = 1,
): PlayerItem {
  return {
    ...(equipment.armor !== undefined && { armor: equipment.armor }),
    category: equipment.category,
    ...(equipment.consumable !== undefined && {
      consumable: equipment.consumable,
    }),
    detail: equipment.description,
    ...(equipment.effects !== undefined && { effects: equipment.effects }),
    id: equipment.id,
    image: equipment.image,
    levelRequirement: equipment.levelRequirement,
    name: equipment.name,
    power: equipment.power,
    price: equipment.price,
    quantity,
    ...(equipment.slot !== null && { slot: equipment.slot }),
    ...(equipment.tags !== undefined && { tags: equipment.tags }),
    tone: CATEGORY_TONES[equipment.category],
    ...(equipment.use !== undefined && { use: equipment.use }),
  };
}

/** Whether the player meets an item's level gate. */
export function meetsLevelRequirement(
  playerLevel: number,
  equipment: Pick<Equipment, "levelRequirement">,
): boolean {
  return playerLevel >= equipment.levelRequirement;
}

/** Resale value when a player sells gear back to the store. */
export const SELL_PRICE_FACTOR = 0.5;

export function sellPrice(price: number, quantity = 1): number {
  return Math.floor(price * SELL_PRICE_FACTOR) * quantity;
}

export type { EquipmentSlotId };
