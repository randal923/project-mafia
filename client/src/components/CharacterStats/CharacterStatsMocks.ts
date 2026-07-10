import type { Player } from "./CharacterStatsTypes";

export const ricoVale: Player = {
  id: "user_123",
  name: "Rico Vale",
  nameKey: "rico vale",
  avatar: null,
  prison: null,
  rank: "nobody",
  resources: {
    cash: 500,
    drunk: 0,
    heat: 0,
    high: 0,
    power: 3,
    stamina: 100
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
      charisma: 1,
      muscle: 1,
      strategy: 1,
      corruption: 1,
      stealth: 1,
      tech: 1,
      leadership: 1
    },
    skillExperience: {
      charisma: 0,
      muscle: 0,
      strategy: 0,
      corruption: 0,
      stealth: 0,
      tech: 0,
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
  prison: null,
  rank: "district_boss",
  resources: {
    cash: 48200,
    drunk: 25,
    heat: 34,
    high: 10,
    power: 18,
    stamina: 65
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
    level: 58,
    experience: 2450,
    skillPoints: 0,
    skills: {
      charisma: 33,
      muscle: 41,
      strategy: 52,
      corruption: 38,
      stealth: 24,
      tech: 47,
      leadership: 50
    },
    skillExperience: {
      charisma: 12,
      muscle: 31,
      strategy: 45,
      corruption: 80,
      stealth: 95,
      tech: 52,
      leadership: 26
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
