import { describe, expect, it } from "vitest";
import type { ChoiceEdge, Mission } from "../../../../shared/job";
import { createNewPlayer, type Player } from "../../../../shared/player";
import { TEST_ENGINE, TEST_TEMPLATE } from "../../engine/__tests__/fixtures";
import { ROOT_NODE_ID } from "../../engine/SkeletonBuilder";
import type { FirebaseService } from "../FirebaseService";
import type { JobBoardService } from "../JobBoardService";
import { MissionService } from "../MissionService";
import type { MissionTemplateService } from "../MissionTemplateService";
import type { NotificationService } from "../NotificationService";
import type { EffectsService } from "../EffectsService";
import type { SeasonService } from "../SeasonService";
import type { WorldEventService } from "../WorldEventService";
import type { PrisonService } from "../PrisonService";
import type { MissionNarrator } from "../ai/MissionNarrator";
import type { EngineConfigService } from "../EngineConfigService";

const NOW = "2026-07-10T12:00:00.000Z";

type StoredDocument = Mission | Player;

type DocumentDouble = {
  collection: (name: string) => CollectionDouble;
  path: string;
};

type CollectionDouble = {
  doc: (id: string) => DocumentDouble;
};

function createMissionHarness(player: Player, mission: Mission) {
  const documents = new Map<string, StoredDocument>([
    [`players/${player.id}`, structuredClone(player)],
    [`players/${player.id}/missions/${mission.id}`, structuredClone(mission)],
  ]);
  const collection = (path: string): CollectionDouble => ({
    doc: (id) => document(`${path}/${id}`),
  });
  const document = (path: string): DocumentDouble => ({
    collection: (name) => collection(`${path}/${name}`),
    path,
  });
  const transaction = {
    create: (reference: DocumentDouble, value: StoredDocument) => {
      documents.set(reference.path, structuredClone(value));
    },
    get: async (reference: DocumentDouble) => {
      const stored = documents.get(reference.path);
      return {
        data: () => structuredClone(stored),
        exists: stored !== undefined,
      };
    },
    set: (reference: DocumentDouble, value: StoredDocument) => {
      documents.set(reference.path, structuredClone(value));
    },
  };
  const firestore = {
    collection: (name: string) => collection(name),
    runTransaction: async <T>(
      operation: (value: typeof transaction) => Promise<T>,
    ): Promise<T> => operation(transaction),
  };

  return {
    documents,
    firebase: { firestore } as unknown as FirebaseService,
  };
}

function createLegacyToolMission(player: Player): Mission {
  return {
    choicePath: [],
    createdAt: NOW,
    currentNodeId: ROOT_NODE_ID,
    depth: 1,
    generationStartedAt: NOW,
    id: "legacy-mission",
    nodes: {
      [ROOT_NODE_ID]: {
        choices: [
          {
            approach: "quiet",
            check: { difficulty: 20, skill: "stealth" },
            damage: null,
            gear: {
              consumes: false,
              item: {
                consumable: false,
                id: "lockpick-set",
                name: "Lockpick Set",
                power: 0,
              },
              label: "Lockpick Set",
              satisfied: true,
              tags: ["lockpick"],
            },
            healthRisk: false,
            id: "0",
            intent: "Open the lock quietly.",
            label: "Pick the lock",
            momentumDelta: 2,
            riskHint: "A guard may hear the tumblers.",
            roll: {
              margin: 20,
              passChance: 60,
              passed: true,
              value: 40,
            },
          },
        ],
        depth: 0,
        id: ROOT_NODE_ID,
        kind: "beat",
        momentum: 0,
        narrative: null,
        narrativeStatus: "ready",
        outcomeTier: null,
      },
      "0": {
        choices: null,
        depth: 1,
        id: "0",
        kind: "outcome",
        momentum: 2,
        narrative: null,
        narrativeStatus: "ready",
        outcomeTier: "successful",
      },
    },
    offer: {
      difficulty: 20,
      district: "Docks",
      heatIncrease: 2,
      id: "legacy-offer",
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
    promptVersion: "legacy",
    resolution: null,
    seed: "legacy-seed",
    status: "active",
    template: TEST_TEMPLATE,
    uid: player.id,
    updatedAt: NOW,
  };
}

describe("MissionService choice application", () => {
  it("spends gear and applies Health loss exactly once for a repeated choice", async () => {
    const player = createNewPlayer("player-1", "Test Player", NOW);
    player.resources.health = 2;
    player.stash = [
      {
        consumable: true,
        id: "crowbar",
        name: "Crowbar",
        power: 0,
        quantity: 1,
        tags: ["crowbar"],
      },
    ];
    player.reservedEquipment = {
      items: { crowbar: 1 },
      missionId: "mission-1",
    };
    const mission: Mission = {
      choicePath: [],
      createdAt: NOW,
      currentNodeId: ROOT_NODE_ID,
      depth: 2,
      generationStartedAt: NOW,
      id: "mission-1",
      nodes: {
        [ROOT_NODE_ID]: {
          choices: [
            {
              approach: "force",
              check: { difficulty: 25, skill: "muscle" },
              damage: { absorbed: 1, healthLost: 4, incoming: 5 },
              gear: {
                consumes: true,
                item: {
                  consumable: true,
                  id: "crowbar",
                  name: "Crowbar",
                  power: 0,
                },
                label: "Crowbar",
                satisfied: true,
                tags: ["crowbar"],
              },
              healthRisk: true,
              id: "0",
              intent: "Pry the hinges before the guards arrive.",
              label: "Lever the door open",
              momentumDelta: -2,
              riskHint: "The blast may bring the ceiling down.",
              roll: {
                margin: -20,
                passChance: 50,
                passed: false,
                value: 70,
              },
            },
          ],
          depth: 0,
          id: ROOT_NODE_ID,
          kind: "beat",
          momentum: 0,
          narrative: null,
          narrativeStatus: "ready",
          outcomeTier: null,
        },
        "0": {
          choices: null,
          depth: 1,
          id: "0",
          kind: "beat",
          momentum: -2,
          narrative: null,
          narrativeStatus: "ready",
          outcomeTier: null,
        },
      },
      offer: {
        difficulty: 25,
        district: "Docks",
        heatIncrease: 2,
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
      uid: player.id,
      updatedAt: NOW,
    };
    const harness = createMissionHarness(player, mission);
    const service = new MissionService(
      harness.firebase,
      {} as JobBoardService,
      {} as MissionNarrator,
      {} as MissionTemplateService,
      { config: TEST_ENGINE } as EngineConfigService,
      {} as PrisonService,
      { push: async () => undefined } as unknown as NotificationService,
      { emit: async () => undefined } as unknown as WorldEventService,
      { getActiveSeason: async () => ({ id: "season-test" }) } as unknown as SeasonService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );

    const playerPath = `players/${player.id}`;
    const missionPath = `${playerPath}/missions/${mission.id}`;
    harness.documents.set(playerPath, { ...player, stash: [] });
    await expect(service.choose(player, mission.id, "0")).rejects.toMatchObject(
      { statusCode: 409 },
    );
    expect((harness.documents.get(missionPath) as Mission).choicePath).toEqual(
      [],
    );
    harness.documents.set(playerPath, structuredClone(player));

    const first = await service.choose(player, mission.id, "0");

    expect(first.player.resources.health).toBe(1);
    expect(first.player.stash).toEqual([]);
    expect(first.mission.nodes[ROOT_NODE_ID]?.choices?.[0]?.damage).toEqual({
      absorbed: 1,
      healthLost: 1,
      incoming: 5,
    });
    await expect(service.choose(player, mission.id, "0")).rejects.toMatchObject(
      { statusCode: 400 },
    );

    const stored = harness.documents.get(playerPath) as Player;
    expect(stored.resources.health).toBe(1);
    expect(stored.stash).toEqual([]);
  });

  it("grandfathers a stored reusable tool edge on an active mission", async () => {
    const player = createNewPlayer("legacy-player", "Legacy Player", NOW);
    player.stash = [
      {
        id: "lockpick-set",
        name: "Lockpick Set",
        power: 0,
        tags: ["lockpick"],
      },
    ];
    player.reservedEquipment = {
      items: { "lockpick-set": 1 },
      missionId: "legacy-mission",
    };
    const mission = createLegacyToolMission(player);
    const harness = createMissionHarness(player, mission);
    const service = new MissionService(
      harness.firebase,
      {} as JobBoardService,
      {} as MissionNarrator,
      {} as MissionTemplateService,
      { config: TEST_ENGINE } as EngineConfigService,
      {} as PrisonService,
      { push: async () => undefined } as unknown as NotificationService,
      { emit: async () => undefined } as unknown as WorldEventService,
      { getActiveSeason: async () => ({ id: "season-test" }) } as unknown as SeasonService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );

    const result = await service.choose(player, mission.id, "0");

    expect(result.mission.choicePath).toEqual(["0"]);
    expect(result.mission.status).toBe("resolved");
    expect(result.mission.nodes[ROOT_NODE_ID]?.choices?.[0]?.gear).toMatchObject(
      {
        consumes: false,
        item: { consumable: false, id: "lockpick-set" },
      },
    );
    expect(result.player.stash).toMatchObject([
      { consumable: true, id: "lockpick-set", quantity: 1 },
    ]);
    expect(result.player.reservedEquipment).toBeNull();
  });

  function createStakesMission(
    player: Player,
    edge: Partial<ChoiceEdge>,
  ): Mission {
    const base = createLegacyToolMission(player);
    return {
      ...base,
      depth: 2,
      id: "stakes-mission",
      momentumBands: {
        failureAtLeast: -4,
        jackpotAbove: 4,
        partialFailureAtLeast: -2,
        partiallySuccessfulAtLeast: 1,
        successfulAtLeast: 2,
      },
      nodes: {
        ...base.nodes,
        [ROOT_NODE_ID]: {
          ...base.nodes[ROOT_NODE_ID]!,
          choices: [
            {
              ...base.nodes[ROOT_NODE_ID]!.choices![0]!,
              gear: null,
              momentumPreview: { fail: -3, pass: 3 },
              stakes: "bolder",
              ...edge,
            },
          ],
        },
        "0": {
          ...base.nodes["0"]!,
          kind: "beat",
          outcomeTier: null,
        },
      },
    };
  }

  it("rejects a stakes-era choice whose gear the player does not own", async () => {
    const player = createNewPlayer("gated-player", "Gated Player", NOW);
    const mission = createStakesMission(player, {
      gear: {
        consumes: true,
        item: null,
        label: "Lockpick Set",
        satisfied: false,
        tags: ["lockpick"],
      },
    });
    const harness = createMissionHarness(player, mission);
    const service = new MissionService(
      harness.firebase,
      {} as JobBoardService,
      {} as MissionNarrator,
      {} as MissionTemplateService,
      { config: TEST_ENGINE } as EngineConfigService,
      {} as PrisonService,
      { push: async () => undefined } as unknown as NotificationService,
      { emit: async () => undefined } as unknown as WorldEventService,
      { getActiveSeason: async () => ({ id: "season-test" }) } as unknown as SeasonService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );

    await expect(
      service.choose(player, mission.id, "0"),
    ).rejects.toMatchObject({ statusCode: 400 });
    const stored = harness.documents.get(
      `players/${player.id}/missions/${mission.id}`,
    ) as Mission;
    expect(stored.choicePath).toEqual([]);
  });

  it("charges the approach's cash up front and adds heat on a failed check", async () => {
    const player = createNewPlayer("costed-player", "Costed Player", NOW);
    player.resources.cash = 25;
    player.resources.heat = 10;
    const mission = createStakesMission(player, {
      cashCost: 40,
      heatOnFail: 3,
      momentumDelta: -3,
      roll: { margin: -20, passChance: 60, passed: false, value: 80 },
    });
    const harness = createMissionHarness(player, mission);
    const service = new MissionService(
      harness.firebase,
      {} as JobBoardService,
      {} as MissionNarrator,
      {} as MissionTemplateService,
      { config: TEST_ENGINE } as EngineConfigService,
      {} as PrisonService,
      { push: async () => undefined } as unknown as NotificationService,
      { emit: async () => undefined } as unknown as WorldEventService,
      { getActiveSeason: async () => ({ id: "season-test" }) } as unknown as SeasonService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );

    const result = await service.choose(player, mission.id, "0");

    // A broke player pays what they have; the failed roll marks them.
    expect(result.player.resources.cash).toBe(0);
    expect(result.player.resources.heat).toBe(13);
    const storedEdge = result.mission.nodes[ROOT_NODE_ID]!.choices![0]!;
    expect(storedEdge.cashSpent).toBe(25);
    expect(storedEdge.heatGained).toBe(3);
  });

  it("adds no heat when the costed check passes", async () => {
    const player = createNewPlayer("lucky-player", "Lucky Player", NOW);
    player.resources.cash = 100;
    player.resources.heat = 10;
    const mission = createStakesMission(player, {
      cashCost: 40,
      heatOnFail: 3,
      momentumDelta: 3,
      roll: { margin: 20, passChance: 60, passed: true, value: 40 },
    });
    const harness = createMissionHarness(player, mission);
    const service = new MissionService(
      harness.firebase,
      {} as JobBoardService,
      {} as MissionNarrator,
      {} as MissionTemplateService,
      { config: TEST_ENGINE } as EngineConfigService,
      {} as PrisonService,
      { push: async () => undefined } as unknown as NotificationService,
      { emit: async () => undefined } as unknown as WorldEventService,
      { getActiveSeason: async () => ({ id: "season-test" }) } as unknown as SeasonService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );

    const result = await service.choose(player, mission.id, "0");

    expect(result.player.resources.cash).toBe(60);
    expect(result.player.resources.heat).toBe(10);
    const storedEdge = result.mission.nodes[ROOT_NODE_ID]!.choices![0]!;
    expect(storedEdge.cashSpent).toBe(40);
    expect(storedEdge.heatGained).toBe(0);
  });
});
