import { describe, expect, it } from "vitest";
import type { ChoiceEdge, JobOffer, Mission } from "../../../../shared/job";
import { ROOT_NODE_ID } from "../../engine/SkeletonBuilder";
import { TEST_TEMPLATE } from "../../engine/__tests__/fixtures";
import { MissionViewService } from "../MissionViewService";

const NOW = "2026-07-10T12:00:00.000Z";

const offer: JobOffer = {
  difficulty: 20,
  district: "Docks",
  heatIncrease: 2,
  id: "offer-1",
  rewardMax: 100,
  rewardMin: 50,
  storySeed: {
    location: "Pier 9",
    premise: "Lift the customs ledger.",
    pressure: "The watch changes at dawn.",
  },
  templateId: TEST_TEMPLATE.id,
  type: TEST_TEMPLATE.type,
};

const futureEdge: ChoiceEdge = {
  approach: "quiet",
  check: { difficulty: 20, skill: "stealth" },
  checkBreakdown: {
    approachBonus: 0,
    baseChance: 52,
    characterPower: 2,
    characterPowerBonus: 0,
    consumablePower: 0,
    consumablePowerBonus: 0,
    difficultyModifier: -16,
    equipmentPower: 30,
    equipmentPowerBonus: 1,
    equipmentSkillBonus: 6,
    finalAdjustment: 0,
    finalChance: 63,
    heatPenalty: 0,
    intoxicationPenalty: 0,
    powerDivisor: 25,
    skillChance: 20,
    skillLevel: 20,
    unclampedChance: 63,
  },
  damage: { absorbed: 1, healthLost: 3, incoming: 4 },
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
  id: "0",
  intent: "Stay out of sight.",
  label: "Take the dark stairwell",
  momentumDelta: -2,
  riskHint: "The guard can hear every loose stair.",
  roll: {
    margin: -17,
    passChance: 63,
    passed: false,
    value: 80,
  },
};

const mission: Mission = {
  choicePath: [],
  createdAt: NOW,
  currentNodeId: ROOT_NODE_ID,
  depth: 1,
  generationStartedAt: NOW,
  id: "mission-1",
  nodes: {
    [ROOT_NODE_ID]: {
      choices: [futureEdge],
      depth: 0,
      id: ROOT_NODE_ID,
      kind: "beat",
      momentum: 0,
      narrative: {
        body: "The ledger is upstairs.",
        stakes: "One guard remains.",
        storySummary: null,
        title: "Inside the warehouse",
      },
      narrativeStatus: "ready",
      outcomeTier: null,
    },
    "0": {
      choices: null,
      depth: 1,
      id: "0",
      kind: "outcome",
      momentum: -2,
      narrative: null,
      narrativeStatus: "pending",
      outcomeTier: "partial_failure",
    },
  },
  offer,
  promptVersion: "test",
  resolution: null,
  seed: "seed",
  status: "active",
  template: TEST_TEMPLATE,
  uid: "player-1",
  updatedAt: NOW,
};

describe("MissionViewService", () => {
  it("projects odds and skill XP without exposing a future roll", () => {
    const choice = MissionViewService.toView(mission).choices?.[0];

    expect(choice).toMatchObject({
      check: { difficulty: 20, skill: "stealth" },
      checkBreakdown: {
        equipmentPowerBonus: 1,
        finalChance: 63,
        powerDivisor: 25,
      },
      gear: {
        consumes: true,
        item: {
          id: "lockpick-set",
          name: "Lockpick Set",
          power: 0,
        },
        satisfied: true,
      },
      healthRisk: true,
      odds: { failure: 37, success: 63 },
      skillExperience: { criticalSuccess: 62, success: 31 },
    });
    expect(choice).not.toHaveProperty("roll");
    expect(choice).not.toHaveProperty("momentumDelta");
    expect(choice).not.toHaveProperty("damage");
    expect(JSON.stringify(choice)).not.toContain('"passed"');
    expect(JSON.stringify(choice)).not.toContain('"value"');
    expect(JSON.stringify(choice)).not.toContain('"margin"');
  });

  it("reveals stored damage only after the edge is taken", () => {
    const advanced: Mission = {
      ...mission,
      choicePath: ["0"],
      currentNodeId: "0",
    };
    const edge = MissionViewService.toView(advanced).steps[1]?.edgeTaken;

    expect(edge).toMatchObject({
      damage: { absorbed: 1, healthLost: 3, incoming: 4 },
      passed: false,
    });
  });

  it("keeps an older reusable edge readable when XP settings are absent", () => {
    const legacyBreakdown = { ...futureEdge.checkBreakdown! };
    delete legacyBreakdown.powerDivisor;
    const legacyEdge: ChoiceEdge = {
      ...futureEdge,
      checkBreakdown: legacyBreakdown,
      gear: {
        ...futureEdge.gear!,
        consumes: false,
        item: { ...futureEdge.gear!.item!, consumable: false },
      },
    };
    const legacyMission = {
      ...mission,
      nodes: {
        ...mission.nodes,
        [ROOT_NODE_ID]: {
          ...mission.nodes[ROOT_NODE_ID]!,
          choices: [legacyEdge],
        },
      },
      template: undefined,
    } as unknown as Mission;

    const choice = MissionViewService.toView(legacyMission).choices?.[0];
    expect(choice).toMatchObject({
      gear: {
        consumes: false,
        item: { consumable: false, id: "lockpick-set" },
      },
      odds: { failure: 37, success: 63 },
      skillExperience: null,
    });
    expect(choice?.checkBreakdown).not.toHaveProperty("powerDivisor");
  });
});
