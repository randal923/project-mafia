import type {
  EquipmentSlot,
  LoadoutState,
  ProfileItem,
  ProfileItemsById,
  ProfileStatus,
} from "./profileTypes";

export const profileStatus: ProfileStatus = {
  name: "Enzo Ricci",
  resources: {
    cleanMoney: 50,
    dirtyMoney: 0,
    power: 3,
  },
};

export const equipmentSlots: EquipmentSlot[] = [
  { id: "hand", label: "Hand" },
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" },
];

export const profileItems: ProfileItem[] = [
  {
    id: "stiletto-knife",
    label: "Stiletto Knife",
    category: "hand",
    detail: "Close weapon",
    power: 5,
    icon: "KN",
    imageSrc: "/assets/profile/knife.png",
  },
];

export const profileItemsById = Object.fromEntries(
  profileItems.map((item) => [item.id, item]),
) as ProfileItemsById;

export const initialLoadoutState: LoadoutState = {
  equipment: {
    hand: "stiletto-knife",
    head: null,
    torso: null,
    waist: null,
    feet: null,
  },
  inventory: [],
};
