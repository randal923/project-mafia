/**
 * The single registry of city districts. Mission templates reference these
 * by label (their `district:` field); the map, turfs, and landmarks
 * reference them by id. Adding a district is ONE entry here.
 */
export const DISTRICT_IDS = [
  "downtown",
  "hillcrest",
  "ironworks",
  "neon_strip",
  "old_quarter",
  "riverside",
  "the_docks",
] as const;

export type DistrictId = (typeof DISTRICT_IDS)[number];

export type DistrictDefinition = {
  /** Flavor line shown on the map sidebar. */
  description: string;
  /** Exact string mission templates use in their `district:` field. */
  label: string;
  /** Respect weight: holding turf here scores harder than the outskirts. */
  respectWeight: number;
  /** Baseline hourly cash a controlled turf here kicks up, before buildings. */
  turfIncomePerHour: number;
};

export const DISTRICTS: Record<DistrictId, DistrictDefinition> = {
  downtown: {
    description:
      "Banks, towers, and the precinct HQ. The most contested blocks in the city.",
    label: "Downtown",
    respectWeight: 2,
    turfIncomePerHour: 150,
  },
  hillcrest: {
    description:
      "Old money on the heights. Quiet streets, deep pockets, long memories.",
    label: "Hillcrest",
    respectWeight: 1.5,
    turfIncomePerHour: 110,
  },
  ironworks: {
    description:
      "Foundries and freight. Union muscle runs deep and everything is for sale.",
    label: "Ironworks",
    respectWeight: 1,
    turfIncomePerHour: 70,
  },
  neon_strip: {
    description:
      "Clubs, tables, and neon. Cash moves fast and so do reputations.",
    label: "Neon Strip",
    respectWeight: 1.5,
    turfIncomePerHour: 120,
  },
  old_quarter: {
    description:
      "The city's first streets. Tight alleys, old families, older debts.",
    label: "Old Quarter",
    respectWeight: 1,
    turfIncomePerHour: 80,
  },
  riverside: {
    description:
      "Warehouses and card rooms along the water. Freight in, product out.",
    label: "Riverside",
    respectWeight: 1,
    turfIncomePerHour: 75,
  },
  the_docks: {
    description:
      "Cranes, containers, and customs men who look away. The city's back door.",
    label: "The Docks",
    respectWeight: 1,
    turfIncomePerHour: 65,
  },
};

const DISTRICT_ID_BY_LABEL = new Map(
  DISTRICT_IDS.map((id) => [DISTRICTS[id].label, id]),
);

/** Resolves a mission template's district label to a registry id. */
export function districtIdForLabel(label: string): DistrictId | null {
  return DISTRICT_ID_BY_LABEL.get(label) ?? null;
}
