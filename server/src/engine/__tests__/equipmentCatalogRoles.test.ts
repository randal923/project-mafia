import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  Equipment,
  equipmentCatalogSchema,
  equipmentSchema,
  equipmentToPlayerItem,
} from "../../../../shared/equipment";
import { APPROACH_SKILLS, JOB_APPROACHES } from "../../../../shared/job";
import { MissionTemplate } from "../../../../shared/missionTemplate";
import { Player, createNewPlayer } from "../../../../shared/player";
import { EquipmentService } from "../../services/EquipmentService";
import { FirebaseService } from "../../services/FirebaseService";
import { LoadoutService } from "../../services/LoadoutService";
import { StoreService } from "../../services/StoreService";
import { HealthService } from "../HealthService";
import { JobOfferBuilder } from "../JobOfferBuilder";
import { MomentumService } from "../MomentumService";
import { PlayerContextService } from "../PlayerContextService";
import { RewardService } from "../RewardService";
import { SkeletonBuilder } from "../SkeletonBuilder";
import { TEST_ENGINE, TEST_TEMPLATE } from "./fixtures";

const NOW = new Date().toISOString();

const catalog = equipmentCatalogSchema.parse(
  JSON.parse(
    readFileSync(
      join(process.cwd(), "src", "seedData", "equipments.json"),
      "utf8",
    ),
  ),
);

type CatalogRole =
  | "consumed mission gear"
  | "equipped"
  | "equipped + reusable mission gear"
  | "healing"
  | "preparation"
  | "reusable mission gear";

type TransactionDouble = {
  get: () => Promise<{ data: () => Player; exists: boolean }>;
  set: (_reference: object, player: Player) => void;
};

function catalogRole(item: Equipment): CatalogRole {
  if (item.slot !== null) {
    return item.tags?.length
      ? "equipped + reusable mission gear"
      : "equipped";
  }
  if (item.tags?.length) {
    return item.consumable
      ? "consumed mission gear"
      : "reusable mission gear";
  }
  if (item.use?.health) {
    return "healing";
  }
  if (item.use) {
    return "preparation";
  }

  throw new Error(`${item.id} has no mechanical role.`);
}

function createFirebaseHarness(player: Player): FirebaseService {
  let stored = structuredClone(player);
  const playerReference = {};
  const firestore = {
    collection: () => ({ doc: () => playerReference }),
    runTransaction: async (
      operation: (transaction: TransactionDouble) => Promise<unknown>,
    ): Promise<unknown> =>
      operation({
        get: async () => ({
          data: () => structuredClone(stored),
          exists: true,
        }),
        set: (_reference, updated) => {
          stored = structuredClone(updated);
        },
      }),
  };

  return { firestore } as unknown as FirebaseService;
}

describe("every catalog item's mechanical role", () => {
  const cases = catalog.map((item) => ({
    id: item.id,
    item,
    role: catalogRole(item),
  }));

  it("assigns exactly one audited case to each of all 111 items", () => {
    expect(cases).toHaveLength(111);
    expect(new Set(cases.map(({ id }) => id)).size).toBe(111);
  });

  it.each(cases)("exercises $id as $role", async ({ item }) => {
    if (item.slot !== null) {
      const equipped = equipmentToPlayerItem(item);
      const player = createNewPlayer(item.id, item.name, NOW, {
        [item.slot]: equipped,
      });
      const context = PlayerContextService.fromPlayer(player);
      const accepted = PlayerContextService.acceptedState(
        player,
        TEST_TEMPLATE,
      );

      expect(context.equipmentPower).toBe(item.power);
      expect(context.armor).toBe(item.armor ?? 0);
      expect(accepted.loadout[item.slot]?.id).toBe(item.id);
      expect(accepted.equipmentPower).toBe(item.power);
      expect(accepted.armor).toBe(item.armor ?? 0);
      const ordinaryCheck = MomentumService.checkBreakdown(
        context,
        "strategy",
        "opportunistic",
        20,
        TEST_ENGINE,
      );
      expect(ordinaryCheck.equipmentPowerBonus).toBe(
        Math.floor(
          (player.resources.power + item.power) /
            TEST_ENGINE.checks.powerDivisor,
        ) -
          Math.floor(
            player.resources.power / TEST_ENGINE.checks.powerDivisor,
          ),
      );
      if (item.armor !== undefined) {
        expect(HealthService.damageForFailure(100, item.armor).absorbed).toBe(
          Math.min(20, Math.ceil(item.armor / 30)),
        );
      }

      for (const effect of item.effects ?? []) {
        if (effect.type === "skillBonus") {
          expect(context.bonuses.skillBonus[effect.skill]).toBe(effect.value);
          const approach = JOB_APPROACHES.find(
            (candidate) => APPROACH_SKILLS[candidate] === effect.skill,
          )!;
          expect(
            MomentumService.checkBreakdown(
              context,
              effect.skill,
              approach,
              20,
              TEST_ENGINE,
            ).equipmentSkillBonus,
          ).toBe(TEST_ENGINE.checks.perSkillPoint * effect.value);
        } else if (effect.type === "approachBonus") {
          expect(context.bonuses.approachBonus[effect.approach]).toBe(
            effect.value,
          );
          expect(
            MomentumService.checkBreakdown(
              context,
              APPROACH_SKILLS[effect.approach],
              effect.approach,
              20,
              TEST_ENGINE,
            ).approachBonus,
          ).toBe(effect.value);
        } else {
          expect(context.bonuses.heatReduction).toBe(effect.value);
          expect(
            RewardService.mitigateHeat(
              { cashChange: 0, heatChange: 50, xpChange: 0 },
              accepted.loadout,
            ).heatChange,
          ).toBe(50 - effect.value);
        }
      }
    }

    if (item.tags?.length) {
      const player = createNewPlayer(item.id, item.name, NOW);
      player.progression.level = item.levelRequirement;
      if (item.slot === null) {
        player.stash = [equipmentToPlayerItem(item, TEST_TEMPLATE.depth)];
      } else {
        player.loadout[item.slot] = equipmentToPlayerItem(item);
      }
      const template: MissionTemplate = {
        ...TEST_TEMPLATE,
        gear: [
          {
            approaches: [...JOB_APPROACHES],
            chance: 1,
            consumes: item.consumable ?? false,
            label: item.name,
            tags: [...item.tags],
          },
        ],
        id: `catalog-${item.id}`,
      };
      const context = PlayerContextService.fromPlayer(player);
      const offer = JobOfferBuilder.buildOffers(
        context,
        `${item.id}-board`,
        [template],
        TEST_ENGINE,
      )[0]!;
      const nodes = new SkeletonBuilder({
        context,
        depth: template.depth,
        engine: TEST_ENGINE,
        missionId: `${item.id}-mission`,
        offer,
        seed: `${item.id}-seed`,
        template,
      }).build();
      const edges = Object.values(nodes).flatMap((node) => node.choices ?? []);
      const expectedConsumablePower = item.consumable ? item.power : 0;

      for (const edge of edges) {
        expect(edge.gear).toMatchObject({
          consumes: item.consumable ?? false,
          item: { id: item.id, power: item.power },
          satisfied: true,
        });
        expect(edge.checkBreakdown?.consumablePower).toBe(
          expectedConsumablePower,
        );
        expect(edge.checkBreakdown?.consumablePowerBonus).toBe(
          MomentumService.checkBreakdown(
            context,
            edge.check.skill,
            edge.approach,
            edge.check.difficulty,
            TEST_ENGINE,
            expectedConsumablePower,
          ).consumablePowerBonus,
        );
      }

      expect(SkeletonBuilder.reservationsForSubtree(nodes)).toEqual(
        item.consumable
          ? { [item.id]: TEST_TEMPLATE.depth }
          : { [item.id]: 1 },
      );
    }

    if (item.use) {
      const player = createNewPlayer(item.id, item.name, NOW);
      player.progression.level = item.levelRequirement;
      player.resources = {
        ...player.resources,
        drunk: 0,
        health: 10,
        heat: 50,
        high: 0,
        stamina: 0,
      };
      player.stash = [equipmentToPlayerItem(item)];
      const service = new LoadoutService(createFirebaseHarness(player));
      const updated = await service.useItem(player.id, item.id);

      expect(updated.stash).toEqual([]);
      expect(updated.resources.health).toBe(
        item.use.health
          ? HealthService.heal(player, item.use.health, NOW).resources.health
          : player.resources.health,
      );
      expect(updated.resources.stamina).toBe(item.use.stamina ?? 0);
      expect(updated.resources.high).toBe(item.use.high ?? 0);
      expect(updated.resources.drunk).toBe(item.use.drunk ?? 0);
      expect(updated.resources.heat).toBe(50 + (item.use.heat ?? 0));
      expect(item.tags).toBeUndefined();
    }
  });

  it("does not waste healing at full health", async () => {
    const item = catalog.find(({ id }) => id === "first-aid-tin")!;
    const player = createNewPlayer(item.id, item.name, NOW);
    player.progression.level = item.levelRequirement;
    player.stash = [equipmentToPlayerItem(item)];
    const service = new LoadoutService(createFirebaseHarness(player));

    await expect(service.useItem(player.id, item.id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects an active-use item that also claims a mission tag", () => {
    const item = catalog.find(({ id }) => id === "first-aid-tin")!;

    expect(
      equipmentSchema.safeParse({ ...item, tags: ["breaching"] }).success,
    ).toBe(false);
  });

  it("applies accrued Health before deciding whether a kit can be used", async () => {
    const item = catalog.find(({ id }) => id === "first-aid-tin")!;
    const player = createNewPlayer(item.id, item.name, NOW);
    player.progression.level = item.levelRequirement;
    player.resources.health = 95;
    player.stash = [equipmentToPlayerItem(item)];
    player.updatedAt = new Date(Date.parse(NOW) - 3_600_000).toISOString();
    const service = new LoadoutService(createFirebaseHarness(player));

    await expect(service.useItem(player.id, item.id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("soaks a risky failure with the accepted vest, then heals without changing mission state", async () => {
    const vest = catalog.find(({ id }) => id === "padded-work-vest")!;
    const kit = catalog.find(({ id }) => id === "first-aid-tin")!;
    const player = createNewPlayer("armored-player", "Armored Player", NOW, {
      torso: equipmentToPlayerItem(vest),
    });
    player.progression.level = kit.levelRequirement;
    player.stash = [equipmentToPlayerItem(kit)];
    const acceptedState = PlayerContextService.acceptedState(
      player,
      TEST_TEMPLATE,
    );
    const damage = HealthService.damageForFailure(25, acceptedState.armor);
    const damaged = HealthService.applyDamage(player, damage, NOW);
    const storedMissionState = {
      acceptedState,
      currentNodeId: "chosen-edge",
      roll: { passChance: 30, passed: false, value: 70 },
    };
    const beforeHealing = structuredClone(storedMissionState);
    const service = new LoadoutService(createFirebaseHarness(damaged));
    const healed = await service.useItem(player.id, kit.id);

    expect(damage).toEqual({ absorbed: 1, healthLost: 4, incoming: 5 });
    expect(damaged.resources.health).toBe(96);
    expect(healed.resources.health).toBe(100);
    expect(healed.stash).toEqual([]);
    expect(storedMissionState).toEqual(beforeHealing);
  });

  it("prevents using or selling the quantity reserved for an active mission", async () => {
    const item = catalog.find(({ id }) => id === "pep-pills")!;
    const reserved = createNewPlayer(item.id, item.name, NOW);
    reserved.progression.level = item.levelRequirement;
    reserved.stash = [equipmentToPlayerItem(item)];
    reserved.reservedEquipment = {
      items: { [item.id]: 1 },
      missionId: "active-mission",
    };
    const firebase = createFirebaseHarness(reserved);
    const loadout = new LoadoutService(firebase);
    const store = new StoreService(firebase, {} as EquipmentService);

    await expect(loadout.useItem(reserved.id, item.id)).rejects.toMatchObject({
      statusCode: 409,
    });
    await expect(store.sell(reserved.id, item.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("allows an unreserved surplus unit to be sold", async () => {
    const item = catalog.find(({ id }) => id === "pep-pills")!;
    const player = createNewPlayer(item.id, item.name, NOW);
    player.progression.level = item.levelRequirement;
    player.stash = [equipmentToPlayerItem(item, 2)];
    player.reservedEquipment = {
      items: { [item.id]: 1 },
      missionId: "active-mission",
    };
    const service = new StoreService(
      createFirebaseHarness(player),
      {} as EquipmentService,
    );
    const updated = await service.sell(player.id, item.id, 99);

    expect(updated.stash).toMatchObject([{ id: item.id, quantity: 1 }]);
  });

  it("applies accrued Health before a store mutation resets activity time", async () => {
    const item = catalog.find(({ id }) => id === "crowbar")!;
    const player = createNewPlayer(item.id, item.name, NOW);
    player.resources.health = 90;
    player.stash = [equipmentToPlayerItem(item)];
    player.updatedAt = new Date(Date.parse(NOW) - 3_600_000).toISOString();
    const service = new StoreService(
      createFirebaseHarness(player),
      {} as EquipmentService,
    );

    const updated = await service.sell(player.id, item.id);

    expect(updated.resources.health).toBe(100);
  });

  it("keeps an exact reusable mission tool from being sold", async () => {
    const item = catalog.find(({ id }) => id === "crowbar")!;
    const player = createNewPlayer(item.id, item.name, NOW);
    player.stash = [equipmentToPlayerItem(item)];
    player.reservedEquipment = {
      items: { [item.id]: 1 },
      missionId: "active-mission",
    };
    const service = new StoreService(
      createFirebaseHarness(player),
      {} as EquipmentService,
    );

    await expect(service.sell(player.id, item.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
