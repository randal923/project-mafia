import { z } from "zod";
import { JOB_APPROACHES } from "./job";
import {
  EquipmentSlotId,
  PlayerItem,
  PlayerItemTone,
  PlayerSkills,
} from "./player";

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
  "ammo",
  "tool",
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  ammo: "Ammunition",
  armor: "Body Armor",
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

const SKILL_KEYS = [
  "corruption",
  "leadership",
  "muscle",
  "stealth",
  "strategy",
  "tech",
] as const satisfies readonly (keyof PlayerSkills)[];

/** Passive bonuses granted while the item is equipped in the loadout. */
export const equipmentEffectSchema = z.discriminatedUnion("type", [
  z
    .object({
      skill: z.enum(SKILL_KEYS),
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
    /** Damage soak: aids force checks and bleeds off mission heat. */
    armor: z.number().min(0).optional(),
    category: z.enum(EQUIPMENT_CATEGORIES),
    /** Consumables stack in the stash and are spent by mission gear checks. */
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
    /** null = stash-only (consumables, ammo); otherwise the loadout slot. */
    slot: z.enum(["feet", "hand", "head", "torso", "waist"]).nullable(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type Equipment = z.infer<typeof equipmentSchema>;

export const equipmentCatalogSchema = z.array(equipmentSchema);

export const STARTER_EQUIPMENT_ID = "stiletto-knife";

const CATEGORY_TONES: Record<EquipmentCategory, PlayerItemTone> = {
  ammo: "brass",
  armor: "teal",
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
