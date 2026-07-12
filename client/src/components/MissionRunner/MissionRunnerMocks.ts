import type { JobOffer, MissionView } from "@shared/job";

export const docksOffer: JobOffer = {
  difficulty: 12,
  district: "Docks",
  heatIncrease: 2,
  id: "mock-offer-0",
  rewardMax: 90,
  rewardMin: 65,
  storySeed: {
    location: "Pier 9 bonded warehouse",
    premise:
      "A night-shift manifest clerk sells you the location of a cage full of untaxed cigarettes awaiting customs inspection.",
    pressure: "The inspection — and a police walkthrough — happens at dawn."
  },
  templateId: "docks-robbery",
  type: "robbery"
};

export const midMission: MissionView = {
  acceptedState: {
    armor: 6,
    characterPower: 2,
    equipmentPower: 30,
    gear: [
      {
        consumable: true,
        id: "lockpick-set",
        name: "Lockpick Set",
        quantity: 1,
        tags: ["lockpick"]
      }
    ],
    loadout: {
      hand: { id: "service-45", name: "Service .45", power: 27, slot: "hand" },
      torso: {
        armor: 6,
        id: "padded-work-vest",
        name: "Padded Work Vest",
        power: 3,
        slot: "torso"
      }
    },
    totalPower: 32
  },
  choices: [
    {
      approach: "quiet",
      check: { difficulty: 13, skill: "stealth" },
      checkBreakdown: {
        approachBonus: 0,
        baseChance: 52,
        characterPower: 2,
        characterPowerBonus: 0,
        consumablePower: 0,
        consumablePowerBonus: 0,
        difficultyModifier: -10.4,
        equipmentPower: 30,
        equipmentPowerBonus: 1,
        equipmentSkillBonus: 0,
        finalAdjustment: 0,
        finalChance: 72,
        heatPenalty: 0,
        intoxicationPenalty: 0,
        powerDivisor: 25,
        skillChance: 29.4,
        skillLevel: 29.4,
        unclampedChance: 72
      },
      gear: {
        consumes: true,
        item: {
          consumable: true,
          id: "lockpick-set",
          name: "Lockpick Set",
          power: 0,
        },
        label: "Lockpick Set",
        satisfied: true,
        tags: ["lockpick"],
      },
      healthRisk: true,
      id: "00",
      intent: "Reach the cage without waking the dock.",
      label: "Cut through the dark side of the pier",
      locked: false,
      momentumPreview: { fail: -1, pass: 1 },
      odds: { failure: 28, success: 72 },
      riskHint: "One dropped crowbar and the night watchman starts walking.",
      skillExperience: { criticalSuccess: 62, success: 31 },
      stakes: "safer"
    },
    {
      approach: "force",
      check: { difficulty: 30, skill: "muscle" },
      gear: {
        consumes: true,
        label: "Crowbar",
        satisfied: false,
        tags: ["crowbar"]
      },
      heatOnFail: 3,
      id: "01",
      intent: "Make the lock the only obstacle.",
      label: "Force the cage shutter",
      locked: true,
      momentumPreview: { fail: -3, pass: 3 },
      odds: { failure: 62, success: 38 },
      riskHint: "Loud, fast, and no way to take it back.",
      skillExperience: { criticalSuccess: 64, success: 32 },
      stakes: "bolder"
    }
  ],
  createdAt: "2026-07-09T12:00:00.000Z",
  depth: 3,
  id: "mock-mission-1",
  momentum: {
    bands: {
      failureAtLeast: -6,
      jackpotAbove: 6,
      partialFailureAtLeast: -3,
      partiallySuccessfulAtLeast: 1,
      successfulAtLeast: 3
    },
    current: 1
  },
  narrativeProgress: { ready: 15, total: 15 },
  offer: docksOffer,
  resolution: null,
  status: "active",
  steps: [
    {
      edgeTaken: null,
      kind: "beat",
      narrative: {
        body: "The clerk's map is accurate so far. The warehouse sits low and dark at the end of Pier 9, and the customs cage waits somewhere behind its corrugated wall.",
        stakes: "Dawn brings the inspection, the police, and the end of your window.",
        storySummary: null,
        title: "The manifest says row twelve"
      },
      narrativeStatus: "ready",
      nodeId: "root",
      outcomeTier: null
    },
    {
      edgeTaken: {
        approach: "social",
        cashSpent: 5,
        check: { difficulty: 10, skill: "leadership" },
        gear: null,
        id: "0",
        label: "Talk your way past the gate",
        margin: 22,
        momentumDelta: 1,
        passed: true,
        stakes: "safer"
      },
      kind: "beat",
      narrative: {
        body: "The gate guard buys the story about a forgotten delivery slip and waves you through. Inside, the aisles of pallets swallow the sound of your steps.",
        stakes: "The cage is close, but so is the night watchman's route.",
        storySummary: null,
        title: "Inside the wire"
      },
      narrativeStatus: "ready",
      nodeId: "0",
      outcomeTier: null
    }
  ],
  updatedAt: "2026-07-09T12:05:00.000Z"
};

export const equippedMission: MissionView = {
  ...midMission,
  choices: midMission.choices?.map((choice, index) =>
    index === 0
      ? {
          ...choice,
          gear: {
            consumes: true,
            label: "Flashbang",
            satisfied: true,
            tags: ["flashbang"]
          },
          odds: { failure: 20, success: 80 }
        }
      : choice
  ) ?? null
};

export const injuredMission: MissionView = {
  ...midMission,
  steps: midMission.steps.map((step, index) =>
    index === 1 && step.edgeTaken
      ? {
          ...step,
          edgeTaken: {
            ...step.edgeTaken,
            damage: { absorbed: 1, healthLost: 5, incoming: 6 },
            passed: false
          }
        }
      : step
  )
};

export const resolvedMission: MissionView = {
  ...midMission,
  choices: null,
  momentum: midMission.momentum
    ? { ...midMission.momentum, current: 3 }
    : undefined,
  resolution: {
    cashChange: 90,
    heatChange: 1,
    narrativeEventId: "mock-event-1",
    skillExperienceGained: {
      leadership: 31,
      stealth: 62
    },
    tier: "successful",
    xpChange: 30
  },
  status: "resolved",
  steps: [
    ...midMission.steps,
    {
      edgeTaken: {
        approach: "quiet",
        check: { difficulty: 13, skill: "stealth" },
        gear: null,
        id: "00",
        label: "Cut through the dark side of the pier",
        margin: 41,
        momentumDelta: 2,
        passed: true,
        stakes: "safer"
      },
      kind: "outcome",
      narrative: {
        body: "You are gone before the watchman finishes his loop, the van riding low with untaxed cartons. By the time the customs seal is found broken, you are three neighborhoods away counting money.",
        stakes: null,
        storySummary:
          "Cleared out the customs cage at Pier 9 without raising an alarm.",
        title: "Smoke on the water"
      },
      narrativeStatus: "ready",
      nodeId: "000",
      outcomeTier: "successful"
    }
  ]
};

export const resolvedAfterDamageMission: MissionView = {
  ...resolvedMission,
  steps: resolvedMission.steps.map((step, index) =>
    index === resolvedMission.steps.length - 1 && step.edgeTaken
      ? {
          ...step,
          edgeTaken: {
            ...step.edgeTaken,
            damage: { absorbed: 1, healthLost: 1, incoming: 5 },
            gear: {
              consumes: true,
              item: {
                consumable: true,
                id: "door-buster-charge",
                name: "Door-Buster Charge",
                power: 38,
              },
              label: "Breaching charge",
              satisfied: true,
              tags: ["breaching"],
            },
            margin: -12,
            passed: false,
          },
        }
      : step,
  ),
};

export const zeroSkillExperienceMission: MissionView = {
  ...resolvedMission,
  resolution: resolvedMission.resolution
    ? {
        ...resolvedMission.resolution,
        skillExperienceGained: {}
      }
    : null
};

export const generatingMission: MissionView = {
  ...midMission,
  choices: null,
  narrativeProgress: { ready: 3, total: 15 },
  status: "generating",
  steps: [
    {
      edgeTaken: null,
      kind: "beat",
      narrative: null,
      narrativeStatus: "pending",
      nodeId: "root",
      outcomeTier: null
    }
  ]
};
