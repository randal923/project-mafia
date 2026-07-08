import type {
  InventoryItem,
  InventorySlot
} from "../../components/Inventory/InventoryTypes";

export const loadoutSlots: readonly InventorySlot[] = [
  { id: "head", label: "Head" },
  {
    id: "torso",
    item: {
      detail: "A discreet layer under the suit jacket.",
      id: "armored-vest",
      name: "Armored Vest",
      tone: "teal"
    },
    label: "Torso"
  },
  {
    id: "hand",
    item: {
      detail: "Concealable steel for quiet work.",
      id: "stiletto-knife",
      image: {
        alt: "Stiletto knife",
        src: "/images/items/stiletto-knife.png"
      },
      name: "Stiletto Knife",
      tone: "brass"
    },
    label: "Hand"
  },
  { id: "waist", label: "Waist" },
  {
    id: "feet",
    item: {
      detail: "Keeps a meeting clean and exits quiet.",
      id: "polished-shoes",
      name: "Polished Shoes"
    },
    label: "Feet"
  }
];

export const stashItems: readonly InventoryItem[] = [
  {
    detail: "Names three patrol officers taking envelope money.",
    id: "payoff-ledger",
    name: "Payoff Ledger",
    tone: "profit"
  },
  {
    detail: "Opens cheap locks without raising the street alarm.",
    id: "lockpick-roll",
    name: "Lockpick Roll",
    quantityLabel: "x2",
    tone: "teal"
  },
  {
    detail: "Useful once, then every badge in the ward listens harder.",
    id: "police-radio",
    name: "Police Radio",
    tone: "danger"
  }
];
