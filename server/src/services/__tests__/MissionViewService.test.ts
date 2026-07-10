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
  gear: {
    consumes: false,
    label: "Crowbar",
    satisfied: false,
    tags: ["crowbar"],
  },
  id: "0",
  intent: "Stay out of sight.",
  label: "Take the dark stairwell",
  momentumDelta: 3,
  riskHint: "The guard can hear every loose stair.",
  roll: {
    margin: 46,
    passChance: 63,
    passed: true,
    value: 17,
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
      momentum: 3,
      narrative: null,
      narrativeStatus: "pending",
      outcomeTier: "jackpot",
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
      odds: { failure: 37, success: 63 },
      skillExperience: { criticalSuccess: 62, success: 31 },
    });
    expect(choice).not.toHaveProperty("roll");
    expect(choice).not.toHaveProperty("momentumDelta");
    expect(JSON.stringify(choice)).not.toContain('"passed"');
    expect(JSON.stringify(choice)).not.toContain('"value"');
    expect(JSON.stringify(choice)).not.toContain('"margin"');
  });

  it("keeps older missions readable when XP settings are absent", () => {
    const legacyMission = {
      ...mission,
      template: undefined,
    } as unknown as Mission;

    expect(MissionViewService.toView(legacyMission).choices?.[0]).toMatchObject({
      odds: { failure: 37, success: 63 },
      skillExperience: null,
    });
  });
});
