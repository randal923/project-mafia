import type { BuildingDefinition } from "./building";

/**
 * The full building catalog. Static game data, not player state — kept in
 * code (like the skill registry) so both server and client read one source
 * without a Firestore round-trip. Landmarks exist once per city and are
 * pinned to a turf in the city map seed.
 */
export const BUILDING_CATALOG: readonly BuildingDefinition[] = [
  // ---- Class A: personal holdings (off-map, safe forever) ----
  {
    class: "personal",
    cost: 4500,
    description:
      "Machines hum, books stay clean. A quiet earner that keeps your name off the blotter.",
    heatPerDay: -1,
    id: "laundromat",
    incomePerHour: 90,
    name: "Laundromat",
    rankRequirement: "crew_leader",
    staffArchetype: "fixer",
    staffSlots: 1,
  },
  {
    class: "personal",
    cost: 8000,
    description:
      "Best slice on the block, and nobody asks what moves through the back room.",
    heatPerDay: -1,
    id: "pizzeria",
    incomePerHour: 140,
    name: "Pizzeria",
    rankRequirement: "crew_leader",
    staffArchetype: "face",
    staffSlots: 1,
  },
  {
    class: "personal",
    cost: 12000,
    description:
      "A quiet place with clean sheets and a doctor who makes house calls. Hurt crew get back on their feet twice as fast.",
    effects: [{ type: "crewHealFactor", value: 0.5 }],
    heatPerDay: -1,
    id: "safehouse",
    incomePerHour: 0,
    name: "Safehouse",
    rankRequirement: "crew_leader",
    staffArchetype: "underboss",
    staffSlots: 0,
  },
  {
    class: "personal",
    cost: 15000,
    description:
      "Cabs that know every alley and never keep a logbook. Steady fares, better errands.",
    heatPerDay: -2,
    id: "taxi-company",
    incomePerHour: 220,
    name: "Taxi Company",
    rankRequirement: "local_boss",
    staffArchetype: "ghost",
    staffSlots: 1,
  },
  {
    class: "personal",
    cost: 18000,
    description:
      "Rows of crates nobody inventories. Every till you own holds four more hours of take.",
    effects: [{ type: "incomeStorageBonusHours", value: 4 }],
    heatPerDay: 0,
    id: "warehouse",
    incomePerHour: 0,
    name: "Warehouse",
    rankRequirement: "local_boss",
    staffArchetype: "mastermind",
    staffSlots: 0,
  },
  {
    class: "personal",
    cost: 26000,
    description:
      "Everything has a price tag and a story. The estimates are creative; the margins are not.",
    heatPerDay: -2,
    id: "pawn-shop",
    incomePerHour: 320,
    name: "Pawn Shop",
    rankRequirement: "local_boss",
    staffArchetype: "mastermind",
    staffSlots: 1,
  },

  // ---- Class B: rackets (built on turf, captured with it) ----
  {
    class: "racket",
    cost: 20000,
    description:
      "A password, a piano, and shelves of the good stuff. Thirsty city, loyal crowd.",
    heatPerDay: 1,
    id: "speakeasy",
    incomePerHour: 400,
    name: "Speakeasy",
    rankRequirement: "local_boss",
    staffArchetype: "face",
    staffSlots: 1,
  },
  {
    class: "racket",
    cost: 45000,
    description:
      "Velvet, neon, and a cover charge nobody argues with. The till never cools.",
    heatPerDay: 2,
    id: "strip-club",
    incomePerHour: 750,
    name: "Strip Club",
    rankRequirement: "local_boss",
    staffArchetype: "face",
    staffSlots: 2,
  },
  {
    class: "racket",
    cost: 60000,
    description:
      "Cars in whole, parts out the back. Your fences pay 65 cents on the dollar for gear instead of 50.",
    effects: [{ type: "sellPriceFactor", value: 0.65 }],
    heatPerDay: 2,
    id: "chop-shop",
    incomePerHour: 900,
    name: "Chop Shop",
    rankRequirement: "local_boss",
    staffArchetype: "wirehead",
    staffSlots: 2,
  },
  {
    class: "racket",
    cost: 90000,
    description:
      "Friendly terms, unfriendly collections. The vig compounds either way.",
    heatPerDay: 2,
    id: "loan-office",
    incomePerHour: 1300,
    name: "Loan Office",
    rankRequirement: "local_boss",
    staffArchetype: "enforcer",
    staffSlots: 2,
  },
  {
    class: "racket",
    cost: 130000,
    description:
      "Two men in, one purse out. The book takes bets on both and the house never bleeds.",
    heatPerDay: 3,
    id: "fight-club",
    incomePerHour: 1700,
    name: "Fight Club",
    rankRequirement: "district_boss",
    staffArchetype: "enforcer",
    staffSlots: 2,
  },
  {
    class: "racket",
    cost: 200000,
    description:
      "Glassware, burners, and product the street can't get enough of. Runs hot in every sense.",
    heatPerDay: 4,
    id: "drug-lab",
    incomePerHour: 2600,
    name: "Drug Lab",
    rankRequirement: "district_boss",
    staffArchetype: "ghost",
    staffSlots: 3,
  },
  {
    class: "racket",
    cost: 300000,
    description:
      "Crates that skip customs and trucks that drive at night. Volume is the whole business.",
    heatPerDay: 3,
    id: "smuggling-den",
    incomePerHour: 3400,
    name: "Smuggling Den",
    rankRequirement: "crime_lord",
    staffArchetype: "ghost",
    staffSlots: 3,
  },
  {
    class: "racket",
    cost: 500000,
    description:
      "Tables, wheels, and odds that answer to you. The crown jewel of any family's books.",
    heatPerDay: 3,
    id: "casino",
    incomePerHour: 5000,
    name: "Casino",
    rankRequirement: "crime_lord",
    staffArchetype: "mastermind",
    staffSlots: 3,
  },

  // ---- Class C: landmarks (one each, NPC-held, conquest-only) ----
  {
    class: "landmark",
    cost: 0,
    description:
      "The desk every beat cop answers to. The family holding it pays 30% less for every envelope in the city.",
    district: "downtown",
    effects: [{ type: "precinctCostFactor", value: 0.7 }],
    garrisonPower: 120,
    heatPerDay: 0,
    id: "police-precinct-hq",
    incomePerHour: 500,
    name: "Police Precinct HQ",
    rankRequirement: "nobody",
    staffArchetype: "fixer",
    staffSlots: 1,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "Cranes, containers, and customs men on the payroll. The store sells to its holder at 10% off.",
    district: "the_docks",
    effects: [{ type: "storePriceFactor", value: 0.9 }],
    garrisonPower: 100,
    heatPerDay: 0,
    id: "the-port",
    incomePerHour: 1500,
    name: "The Port",
    rankRequirement: "nobody",
    staffArchetype: "ghost",
    staffSlots: 2,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "Permits, zoning, and a clerk who owes you. Turf upkeep runs 25% cheaper citywide.",
    district: "old_quarter",
    effects: [{ type: "upkeepFactor", value: 0.75 }],
    garrisonPower: 90,
    heatPerDay: 0,
    id: "city-hall-annex",
    incomePerHour: 800,
    name: "City Hall Annex",
    rankRequirement: "nobody",
    staffArchetype: "face",
    staffSlots: 1,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "Private wings and discreet surgeons. You and your crew heal twice as fast.",
    district: "hillcrest",
    effects: [
      { type: "crewHealFactor", value: 0.5 },
      { type: "healFactor", value: 0.5 },
    ],
    garrisonPower: 80,
    heatPerDay: 0,
    id: "hillcrest-general",
    incomePerHour: 400,
    name: "Hillcrest General",
    rankRequirement: "nobody",
    staffArchetype: "underboss",
    staffSlots: 1,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "The biggest floor in the city, and the house edge answers to whoever holds it.",
    district: "neon_strip",
    garrisonPower: 140,
    heatPerDay: 0,
    id: "the-grand-casino",
    incomePerHour: 6000,
    name: "The Grand Casino",
    rankRequirement: "nobody",
    staffArchetype: "mastermind",
    staffSlots: 3,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "Every crane and picket line in town listens to this floor. Crew wages drop 20% for its holder.",
    district: "ironworks",
    effects: [{ type: "wageFactor", value: 0.8 }],
    garrisonPower: 90,
    heatPerDay: 0,
    id: "union-hall",
    incomePerHour: 600,
    name: "Union Hall",
    rankRequirement: "nobody",
    staffArchetype: "underboss",
    staffSlots: 1,
  },
  {
    class: "landmark",
    cost: 0,
    description:
      "Rails, trucks, and manifests that say whatever you need. Jobs cost 15% less stamina for its holder.",
    district: "riverside",
    effects: [{ type: "staminaCostFactor", value: 0.85 }],
    garrisonPower: 90,
    heatPerDay: 0,
    id: "riverside-freight-yard",
    incomePerHour: 900,
    name: "Riverside Freight Yard",
    rankRequirement: "nobody",
    staffArchetype: "enforcer",
    staffSlots: 2,
  },
] as const;

const CATALOG_BY_ID = new Map(BUILDING_CATALOG.map((def) => [def.id, def]));

export function buildingDefinition(id: string): BuildingDefinition | null {
  return CATALOG_BY_ID.get(id) ?? null;
}

export function buildingsOfClass(
  buildingClass: BuildingDefinition["class"],
): BuildingDefinition[] {
  return BUILDING_CATALOG.filter((def) => def.class === buildingClass);
}
