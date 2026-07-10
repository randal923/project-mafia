import { describe, expect, it } from "vitest";
import type { Mission } from "../../../../shared/job";
import { createNewPlayer, type Player } from "../../../../shared/player";
import { TEST_ENGINE, TEST_TEMPLATE } from "../../engine/__tests__/fixtures";
import { ROOT_NODE_ID } from "../../engine/SkeletonBuilder";
import type { FirebaseService } from "../FirebaseService";
import type { JobBoardService } from "../JobBoardService";
import { MissionService } from "../MissionService";
import type { MissionTemplateService } from "../MissionTemplateService";
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

describe("MissionService choice application", () => {
  it("spends gear and applies Health loss exactly once for a repeated choice", async () => {
    const player = createNewPlayer("player-1", "Test Player", NOW);
    player.resources.health = 2;
    player.stash = [
      {
        consumable: true,
        id: "door-buster-charge",
        name: "Door-Buster Charge",
        power: 38,
        quantity: 1,
        tags: ["breaching"],
      },
    ];
    player.reservedEquipment = {
      items: { "door-buster-charge": 1 },
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
                  id: "door-buster-charge",
                  name: "Door-Buster Charge",
                  power: 38,
                },
                label: "Breaching charge",
                satisfied: true,
                tags: ["breaching"],
              },
              healthRisk: true,
              id: "0",
              intent: "Blow the hinges.",
              label: "Set the charge",
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
});
