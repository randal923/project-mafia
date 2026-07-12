import { describe, expect, it } from "vitest";
import { createNewPlayer } from "../../../../shared/player";
import { TEST_ENGINE } from "../../engine/__tests__/fixtures";
import type { EffectsService } from "../EffectsService";
import type { EngineConfigService } from "../EngineConfigService";
import type { EquipmentService } from "../EquipmentService";
import type { FirebaseService } from "../FirebaseService";
import { PlayerService } from "../PlayerService";

describe("PlayerService idle recovery", () => {
  it("waits for recovered Health to persist before returning the player", async () => {
    const now = Date.now();
    const player = createNewPlayer(
      "player-1",
      "Test Player",
      new Date(now - 3_600_000).toISOString(),
    );
    player.resources.health = 90;
    let finishUpdate: (() => void) | undefined;
    let updateStarted = false;
    const updateFinished = new Promise<void>((resolve) => {
      finishUpdate = resolve;
    });
    const playerDocument = {
      get: async () => ({ data: () => player, exists: true }),
      update: async () => {
        updateStarted = true;
        await updateFinished;
      },
    };
    const firebase = {
      firestore: {
        collection: () => ({ doc: () => playerDocument }),
      },
    } as unknown as FirebaseService;
    const service = new PlayerService(
      firebase,
      {} as EquipmentService,
      { config: TEST_ENGINE } as EngineConfigService,
      { forPlayer: async () => ({ crewHealFactor: 1, healFactor: 1, incomeStorageBonusHours: 0, precinctCostFactor: 1, sellPriceFactor: null, staminaCostFactor: 1, storePriceFactor: 1, upkeepFactor: 1, wageFactor: 1 }) } as unknown as EffectsService,
    );
    let requestFinished = false;
    const request = service.getPlayer(player.id).then((result) => {
      requestFinished = true;
      return result;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(updateStarted).toBe(true);
    expect(requestFinished).toBe(false);

    finishUpdate?.();
    const recovered = await request;
    expect(recovered?.resources.health).toBe(100);
    expect(requestFinished).toBe(true);
  });
});
