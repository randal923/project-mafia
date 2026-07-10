import type { Player } from "./CharacterStatsTypes";

export const ricoVale: Player = {
  id: "user_123",
  name: "Rico Vale",
  nameKey: "rico vale",
  avatar: null,
  rank: "nobody",
  resources: {
    cash: 500,
    heat: 0,
    power: 3
  },
  narrative: {
    storySummary: "",
    llmMemory: {
      importantFacts: [],
      unresolvedConflicts: []
    }
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
    },
    skillExperience: {
      muscle: 0,
      strategy: 0,
      corruption: 0,
      stealth: 0,
      business: 0,
      leadership: 0
    }
  },
  loadout: {},
  stash: [],
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z"
};

export const soniaMarchetti: Player = {
  id: "user_456",
  name: "Sonia Marchetti",
  nameKey: "sonia marchetti",
  avatar: null,
  rank: "district_boss",
  resources: {
    cash: 48200,
    heat: 34,
    power: 18
  },
  narrative: {
    storySummary:
      "Took over the Riverside protection racket after outmaneuvering the Falcone crew.",
    llmMemory: {
      importantFacts: ["Owes a favor to Detective Marsh"],
      unresolvedConflicts: ["The Falcone crew wants Riverside back"]
    }
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
    },
    skillExperience: {
      muscle: 310,
      strategy: 445,
      corruption: 180,
      stealth: 95,
      business: 520,
      leadership: 260
    }
  },
  loadout: {
    torso: {
      detail: "A discreet layer under the suit jacket.",
      id: "armored-vest",
      name: "Armored Vest",
      tone: "teal"
    }
  },
  stash: [
    {
      detail: "Names three patrol officers taking envelope money.",
      id: "payoff-ledger",
      name: "Payoff Ledger",
      tone: "profit"
    }
  ],
  createdAt: "2026-05-14T09:30:00.000Z",
  updatedAt: "2026-07-06T18:45:00.000Z"
};
