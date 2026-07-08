import type { PlayerProfile } from "./CharacterStatsTypes";

export const ricoVale: PlayerProfile = {
  id: "season_profile_123",
  userId: "user_123",
  seasonId: "season_001",
  name: "Rico Vale",
  title: "Nobody from the Docks",
  status: "active",
  rank: "nobody",
  resources: {
    money: 500,
    cleanMoney: 0,
    dirtyMoney: 500,
    influence: 0,
    power: 3,
    heat: 0,
    actionPoints: 10,
    maxActionPoints: 10
  },
  progression: {
    level: 1,
    experience: 0,
    skillPoints: 0,
    skills: {
      muscle: 1,
      strategy: 1,
      corruption: 0,
      stealth: 1,
      business: 0,
      leadership: 1
    }
  },
  reputation: {
    fear: 0,
    loyalty: 0,
    respect: 0,
    brutality: 0,
    reliability: 0,
    ambition: 10,
    betrayal: 0,
    knownFor: []
  },
  crew: {
    totalMembers: 2,
    availableMembers: 2,
    woundedMembers: 0,
    muscle: 3,
    intelligence: 1,
    loyalty: 5,
    discipline: 2,
    specialists: {
      enforcers: 0,
      drivers: 0,
      fixers: 0,
      hackers: 0,
      negotiators: 0
    }
  },
  territory: {
    controlledDistrictIds: [],
    contestedDistrictIds: ["docks"],
    businessesOwned: 0,
    safehousesOwned: 0,
    districtInfluence: {
      docks: 3
    }
  },
  relationships: [],
  narrative: {
    origin: "broke_outsider",
    personality: {
      style: "calculated",
      moralCode: "loyal_to_crew",
      preferredApproach: "force"
    },
    storySummary:
      "A small-time operator trying to build a crew in the Docks before stronger factions notice.",
    majorEvents: [],
    activeStoryThreads: [],
    llmMemory: {
      importantFacts: [
        "Started with almost no money.",
        "Has a small but loyal crew.",
        "Trying to gain influence in the Docks."
      ],
      recurringCharacters: [],
      unresolvedConflicts: [],
      preferredJobThemes: [
        "small robberies",
        "crew recruitment",
        "territory pressure"
      ]
    }
  }
};

export const soniaMarchetti: PlayerProfile = {
  id: "season_profile_456",
  userId: "user_456",
  seasonId: "season_001",
  name: "Sonia Marchetti",
  title: "The Ledger of Harbor Row",
  status: "active",
  rank: "capo",
  resources: {
    money: 48200,
    cleanMoney: 26000,
    dirtyMoney: 22200,
    influence: 34,
    power: 18,
    heat: 62,
    actionPoints: 6,
    maxActionPoints: 12
  },
  progression: {
    level: 12,
    experience: 8450,
    skillPoints: 2,
    skills: {
      muscle: 6,
      strategy: 7,
      corruption: 5,
      stealth: 4,
      business: 8,
      leadership: 7
    }
  },
  reputation: {
    fear: 55,
    loyalty: 62,
    respect: 71,
    brutality: 38,
    reliability: 80,
    ambition: 66,
    betrayal: 12,
    knownFor: ["The Ledger Fire", "Union Fixer", "Pays On Time"]
  },
  crew: {
    totalMembers: 14,
    availableMembers: 9,
    woundedMembers: 2,
    muscle: 7,
    intelligence: 6,
    loyalty: 8,
    discipline: 7,
    specialists: {
      enforcers: 3,
      drivers: 2,
      fixers: 2,
      hackers: 1,
      negotiators: 1
    }
  },
  territory: {
    controlledDistrictIds: ["harbor_row", "old_market"],
    contestedDistrictIds: ["docks", "iron_quarter"],
    businessesOwned: 4,
    safehousesOwned: 2,
    districtInfluence: {
      harbor_row: 8,
      old_market: 6,
      docks: 4,
      iron_quarter: 2
    }
  },
  relationships: [
    { id: "don_altieri", name: "Don Altieri", standing: 35 },
    { id: "detective_marsh", name: "Detective Marsh", standing: -40 },
    { id: "father_bruno", name: "Father Bruno", standing: 15 }
  ],
  narrative: {
    origin: "family_debt",
    personality: {
      style: "ruthless",
      moralCode: "family_first",
      preferredApproach: "leverage"
    },
    storySummary:
      "Took over her father's book after the Ledger Fire and turned Harbor Row into the most reliable envelope on the coast. The dock unions answer to her; the detectives can't prove why.",
    majorEvents: [
      "Burned the family ledger before the raid could reach it.",
      "Bought out the Harbor Row union stewards in one night.",
      "Survived an ambush in the Old Market fish cellars."
    ],
    activeStoryThreads: [
      "Detective Marsh is building a case from the marina books.",
      "The Iron Quarter crews are testing her southern routes."
    ],
    llmMemory: {
      importantFacts: [
        "Never touches dirty money in public.",
        "Keeps the union stewards on a monthly envelope.",
        "Owes Don Altieri a favor she cannot repay yet."
      ],
      recurringCharacters: ["Don Altieri", "Detective Marsh"],
      unresolvedConflicts: ["Iron Quarter route war"],
      preferredJobThemes: [
        "protection rackets",
        "money laundering",
        "union politics"
      ]
    }
  }
};
