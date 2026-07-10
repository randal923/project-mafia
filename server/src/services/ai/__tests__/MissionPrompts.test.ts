import { describe, expect, it } from "vitest";
import { Mission, MissionNode } from "../../../../../shared/job";
import { createNewPlayer } from "../../../../../shared/player";
import { ROOT_NODE_ID } from "../../../engine/SkeletonBuilder";
import { TEST_TEMPLATE } from "../../../engine/__tests__/fixtures";
import { MissionPrompts } from "../MissionPrompts";

const NOW = "2026-07-10T12:00:00.000Z";

describe("MissionPrompts equipment facts", () => {
  it("treats exact gear, damage, and armor soak as immutable engine facts", () => {
    const edge = {
      approach: "force" as const,
      check: { difficulty: 25, skill: "muscle" as const },
      damage: { absorbed: 1, healthLost: 4, incoming: 5 },
      gear: {
        consumes: true,
        item: {
          consumable: true,
          id: "door-buster-charge",
          name: "Door-Buster Charge",
          power: 38,
        },
        label: "Breaching Gear",
        satisfied: true,
        tags: ["breaching"],
      },
      healthRisk: true,
      id: "0",
      intent: "Open the door.",
      label: "Blow the hinges",
      momentumDelta: -2,
      riskHint: "The guards are waiting.",
      roll: { margin: -20, passChance: 50, passed: false, value: 70 },
    };
    const node: MissionNode = {
      choices: [edge, { ...edge, id: "1", damage: null, healthRisk: false }],
      depth: 1,
      id: "0",
      kind: "beat",
      momentum: -2,
      narrative: null,
      narrativeStatus: "pending",
      outcomeTier: null,
    };
    const mission: Mission = {
      choicePath: ["0"],
      createdAt: NOW,
      currentNodeId: "0",
      depth: 3,
      generationStartedAt: NOW,
      id: "mission-1",
      nodes: {
        [ROOT_NODE_ID]: { ...node, depth: 0, id: ROOT_NODE_ID },
        "0": node,
      },
      offer: {
        difficulty: 25,
        district: "Docks",
        heatIncrease: 4,
        id: "offer-1",
        rewardMax: 100,
        rewardMin: 50,
        storySeed: {
          location: "Warehouse",
          premise: "Take the ledger.",
          pressure: "The guards are close.",
        },
        templateId: TEST_TEMPLATE.id,
        type: TEST_TEMPLATE.type,
      },
      promptVersion: "test",
      resolution: null,
      seed: "seed",
      status: "active",
      template: TEST_TEMPLATE,
      uid: "uid-1",
      updatedAt: NOW,
    };
    const prompt = MissionPrompts.beatPrompt({
      ancestors: [],
      edgeTaken: edge,
      mission,
      node,
      player: createNewPlayer("uid-1", "Test Player", NOW),
    });

    expect(prompt).toContain("Door-Buster Charge");
    expect(prompt).toContain("exact matched item, Door-Buster Charge");
    expect(prompt).toContain("5 incoming damage");
    expect(prompt).toContain("armor absorbed 1");
    expect(prompt).toContain("do not state a live Health total or exact Health loss");
    expect(MissionPrompts.systemPrompt()).toContain(
      "the player may heal between choices",
    );

    const outcomePrompt = MissionPrompts.outcomePrompt({
      ancestors: [node],
      edgeTaken: edge,
      mission,
      node: {
        ...node,
        choices: null,
        kind: "outcome",
        outcomeTier: "failure",
      },
      player: createNewPlayer("uid-1", "Test Player", NOW),
      rewards: { cashChange: 0, heatChange: 4, xpChange: 2 },
    });
    expect(outcomePrompt).toContain("FINAL CHOICE");
    expect(outcomePrompt).toContain("exact matched item, Door-Buster Charge");
    expect(outcomePrompt).toContain("5 incoming damage");
    expect(outcomePrompt).toContain("armor absorbed 1");
  });
});
