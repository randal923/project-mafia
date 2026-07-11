import { describe, expect, it } from "vitest";
import { MAX_HEALTH, recoveredHealth } from "../../../../shared/health";
import { JOB_APPROACHES } from "../../../../shared/job";
import {
  MissionTemplate,
  missionTemplateSchema,
} from "../../../../shared/missionTemplate";
import { createNewPlayer, normalizePlayer } from "../../../../shared/player";
import { HealthService } from "../HealthService";
import { JobOfferBuilder } from "../JobOfferBuilder";
import { MomentumService } from "../MomentumService";
import { PlayerContextService } from "../PlayerContextService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../SkeletonBuilder";
import { consumeMissionGear } from "../consumeMissionGear";
import { TEST_ENGINE, TEST_TEMPLATE } from "./fixtures";

const NOW = "2026-07-10T12:00:00.000Z";

describe("mission equipment and health", () => {
  it("shows starter power accumulating toward the unchanged combined threshold", () => {
    const starter = createNewPlayer("starter", "Starter", NOW, {
      torso: { id: "starter-coat", name: "Starter Coat", power: 3 },
    });
    const threshold = createNewPlayer("threshold", "Threshold", NOW, {
      torso: { id: "threshold-coat", name: "Threshold Coat", power: 23 },
    });
    const starterBreakdown = MomentumService.checkBreakdown(
      PlayerContextService.fromPlayer(starter),
      "stealth",
      "quiet",
      20,
      TEST_ENGINE,
    );
    const thresholdBreakdown = MomentumService.checkBreakdown(
      PlayerContextService.fromPlayer(threshold),
      "stealth",
      "quiet",
      20,
      TEST_ENGINE,
    );

    expect(starterBreakdown).toMatchObject({
      characterPower: 2,
      characterPowerBonus: 0,
      equipmentPower: 3,
      equipmentPowerBonus: 0,
      powerDivisor: 25,
    });
    expect(thresholdBreakdown).toMatchObject({
      characterPower: 2,
      characterPowerBonus: 0,
      equipmentPower: 23,
      equipmentPowerBonus: 1,
      powerDivisor: 25,
    });
    expect(thresholdBreakdown.finalChance).toBe(
      starterBreakdown.finalChance + 1,
    );
  });

  it("attributes character and equipped power while ignoring ordinary stash power", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      hand: { id: "weapon", name: "Weapon", power: 30, slot: "hand" },
    });
    player.stash = [
      {
        armor: 999,
        effects: [{ skill: "stealth", type: "skillBonus", value: 99 }],
        id: "unused",
        name: "Unused stash power",
        power: 999,
      },
    ];
    const context = PlayerContextService.fromPlayer(player);
    const breakdown = MomentumService.checkBreakdown(
      context,
      "stealth",
      "quiet",
      20,
      TEST_ENGINE,
    );

    expect(context.effectivePower).toBe(32);
    expect(context.armor).toBe(0);
    expect(context.bonuses.skillBonus.stealth).toBeUndefined();
    expect(breakdown.characterPowerBonus).toBe(0);
    expect(breakdown.equipmentPowerBonus).toBe(1);
    expect(breakdown.consumablePowerBonus).toBe(0);
    expect(breakdown.powerDivisor).toBe(TEST_ENGINE.checks.powerDivisor);
    expect(breakdown.unclampedChance).toBe(
      breakdown.baseChance +
        breakdown.skillChance +
        breakdown.equipmentSkillBonus +
        breakdown.difficultyModifier +
        breakdown.characterPowerBonus +
        breakdown.equipmentPowerBonus +
        breakdown.approachBonus -
        breakdown.heatPenalty -
        breakdown.intoxicationPenalty,
    );
    expect(breakdown.unclampedChance + breakdown.finalAdjustment).toBe(
      breakdown.finalChance,
    );
  });

  it("guarantees the known missing Lockpick path and consumes the exact tool", () => {
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: [
        {
          approaches: ["quiet", "technical"],
          chance: 0.3,
          consumes: true,
          label: "Lockpick Set",
          tags: ["lockpick"],
        },
      ],
      id: "lockpick-path",
    };
    const prepared = createNewPlayer("prepared", "Prepared", NOW);
    prepared.stash = [
      {
        consumable: true,
        id: "bent-picks",
        name: "Bent Picks",
        power: 1,
        quantity: 1,
        tags: ["lockpick"],
      },
      {
        consumable: true,
        id: "lockpick-set",
        name: "Lockpick Set",
        power: 7,
        quantity: 1,
        tags: ["lockpick"],
      },
    ];
    const missing = createNewPlayer("missing", "Missing", NOW);
    const build = (player: typeof prepared) => {
      const context = PlayerContextService.fromPlayer(player);
      const offer = JobOfferBuilder.buildOffers(
        context,
        "lockpick-board",
        [template],
        TEST_ENGINE,
      )[0]!;

      return new SkeletonBuilder({
        context,
        depth: template.depth,
        engine: TEST_ENGINE,
        missionId: "no-lockpick-mission",
        offer: { ...offer, difficulty: 50 },
        seed: "known-no-lockpick-2",
        template,
      }).build();
    };
    const preparedEdges = Object.values(build(prepared)).flatMap(
      (node) => node.choices ?? [],
    );
    const missingEdges = Object.values(build(missing)).flatMap(
      (node) => node.choices ?? [],
    );
    const preparedLockpickEdges = preparedEdges.filter(
      (edge) => edge.gear?.label === "Lockpick Set",
    );

    expect(preparedLockpickEdges).toHaveLength(1);
    const preparedEdge = preparedLockpickEdges[0]!;
    const missingEdge = missingEdges.find((edge) => edge.id === preparedEdge.id)!;
    expect(template.gear![0]!.approaches).toContain(preparedEdge.approach);
    expect(preparedEdge.gear).toMatchObject({
      consumes: true,
      item: {
        consumable: true,
        id: "lockpick-set",
        name: "Lockpick Set",
        power: 7,
      },
      satisfied: true,
    });
    expect(missingEdge.gear).toMatchObject({
      consumes: true,
      item: null,
      satisfied: false,
    });
    // Missing gear no longer hardens the check — it locks the path —
    // so the only difficulty difference is the preparedness bonus.
    expect(missingEdge.check.difficulty - preparedEdge.check.difficulty).toBe(
      TEST_ENGINE.gear.satisfiedBonus,
    );

    const used = consumeMissionGear(prepared, preparedEdge, NOW);
    expect(used.consumed).toBe(true);
    expect(used.player.stash).toMatchObject([
      { id: "bent-picks", quantity: 1 },
    ]);
  });

  it("reserves and spends each Lockpick Set once along a chosen path", () => {
    const player = createNewPlayer("lockpick-quantity", "Prepared", NOW);
    player.stash = [
      {
        consumable: true,
        id: "lockpick-set",
        name: "Lockpick Set",
        power: 0,
        quantity: 2,
        tags: ["lockpick"],
      },
    ];
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: [
        {
          approaches: [...JOB_APPROACHES],
          chance: 1,
          consumes: true,
          label: "Lockpick Set",
          tags: ["lockpick"],
        },
      ],
      id: "lockpick-quantity",
    };
    const context = PlayerContextService.fromPlayer(player);
    const offer = JobOfferBuilder.buildOffers(
      context,
      "lockpick-quantity-board",
      [template],
      TEST_ENGINE,
    )[0]!;
    const nodes = new SkeletonBuilder({
      context,
      depth: template.depth,
      engine: TEST_ENGINE,
      missionId: "lockpick-quantity-mission",
      offer,
      seed: "lockpick-quantity-seed",
      template,
    }).build();
    const first = nodes[ROOT_NODE_ID]!.choices![0]!;
    const second = nodes[first.id]!.choices![0]!;
    const third = nodes[second.id]!.choices![0]!;

    expect([first, second, third].map((edge) => edge.gear?.satisfied)).toEqual([
      true,
      true,
      false,
    ]);
    expect(SkeletonBuilder.reservationsForSubtree(nodes)).toEqual({
      "lockpick-set": 2,
    });
    expect(SkeletonBuilder.reservationsForSubtree(nodes, first.id)).toEqual({
      "lockpick-set": 1,
    });

    const afterFirst = consumeMissionGear(player, first, NOW);
    const afterSecond = consumeMissionGear(afterFirst.player, second, NOW);
    const afterThird = consumeMissionGear(afterSecond.player, third, NOW);

    expect(afterFirst.player.stash).toMatchObject([
      { id: "lockpick-set", quantity: 1 },
    ]);
    expect(afterSecond.player.stash).toEqual([]);
    expect(afterThird).toEqual({ consumed: false, player: afterSecond.player });
  });

  it("keeps partial-chance gear occurrences beyond the guaranteed edge", () => {
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: [
        {
          approaches: ["quiet", "technical"],
          chance: 0.3,
          consumes: true,
          label: "Lockpick Set",
          tags: ["lockpick"],
        },
      ],
      id: "partial-extra-gear",
    };
    const context = PlayerContextService.fromPlayer(
      createNewPlayer("partial-extra", "Partial Extra", NOW),
    );
    const offer = JobOfferBuilder.buildOffers(
      context,
      "partial-board",
      [template],
      TEST_ENGINE,
    )[0]!;
    const nodes = new SkeletonBuilder({
      context,
      depth: template.depth,
      engine: TEST_ENGINE,
      missionId: "mission-0",
      offer,
      seed: "seed-0",
      template,
    }).build();
    const lockpickEdges = Object.values(nodes)
      .flatMap((node) => node.choices ?? [])
      .filter((edge) => edge.gear?.label === "Lockpick Set");

    expect(lockpickEdges.length).toBeGreaterThan(1);
    expect(
      lockpickEdges.every((edge) =>
        template.gear![0]!.approaches.includes(edge.approach),
      ),
    ).toBe(true);
  });

  it("gives overlapping requirements distinct guaranteed beat nodes", () => {
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: ["Hacking Kit", "Lockpick Set", "Signal Scanner"].map(
        (label) => ({
          approaches: ["technical"],
          chance: 0.01,
          consumes: true,
          label,
          tags: [label],
        }),
      ),
      id: "overlapping-gear",
    };
    const player = createNewPlayer("overlapping", "Overlapping", NOW);
    const context = PlayerContextService.fromPlayer(player);
    const offer = JobOfferBuilder.buildOffers(
      context,
      "overlapping-board",
      [template],
      TEST_ENGINE,
    )[0]!;
    const nodes = new SkeletonBuilder({
      context,
      depth: template.depth,
      engine: TEST_ENGINE,
      missionId: "overlapping-mission",
      offer,
      seed: "overlapping-seed",
      template,
    }).build();
    const guaranteedEdges = Object.values(nodes)
      .flatMap((node) => node.choices ?? [])
      .filter((edge) => edge.gear !== null);

    expect(guaranteedEdges).toHaveLength(template.gear!.length);
    expect(guaranteedEdges.map((edge) => edge.gear!.label).sort()).toEqual(
      template.gear!.map((requirement) => requirement.label).sort(),
    );
    expect(guaranteedEdges.every((edge) => edge.approach === "technical")).toBe(
      true,
    );
    expect(
      new Set(
        guaranteedEdges.map((edge) => SkeletonBuilder.parentNodeId(edge.id)),
      ).size,
    ).toBe(template.gear!.length);
  });

  it("rejects unrollable and over-capacity advertised gear", () => {
    const requirement = {
      approaches: ["technical" as const],
      chance: 0.5,
      consumes: true,
      label: "Tool",
      tags: ["tool"],
    };
    const zeroChance = missionTemplateSchema.safeParse({
      ...TEST_TEMPLATE,
      gear: [{ ...requirement, chance: 0 }],
    });
    const belowD100Precision = missionTemplateSchema.safeParse({
      ...TEST_TEMPLATE,
      gear: [{ ...requirement, chance: 0.009 }],
    });
    const overCapacity = missionTemplateSchema.safeParse({
      ...TEST_TEMPLATE,
      gear: Array.from({ length: 8 }, (_, index) => ({
        ...requirement,
        label: `Tool ${index}`,
      })),
    });

    expect(zeroChance.success).toBe(false);
    expect(belowD100Precision.success).toBe(false);
    expect(overCapacity.success).toBe(false);
    if (!overCapacity.success) {
      expect(overCapacity.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Mission gear cannot exceed its 7 beat nodes.",
            path: ["gear"],
          }),
        ]),
      );
    }
  });

  it("adds the strongest exact consumed item's one-edge power and reserves it", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      hand: { id: "weapon", name: "Weapon", power: 30, slot: "hand" },
    });
    player.stash = [
      {
        consumable: true,
        id: "small-charge",
        name: "Small Charge",
        power: 12,
        quantity: 1,
        tags: ["explosive"],
      },
      {
        consumable: true,
        id: "strong-charge",
        name: "Strong Charge",
        power: 38,
        quantity: 1,
        tags: ["explosive"],
      },
    ];
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: [
        {
          approaches: [...JOB_APPROACHES],
          chance: 1,
          consumes: true,
          label: "Explosive",
          tags: ["explosive"],
        },
      ],
    };
    const context = PlayerContextService.fromPlayer(player);
    const offer = JobOfferBuilder.buildOffers(
      context,
      "board-seed",
      [template],
      TEST_ENGINE,
    )[0]!;
    const nodes = new SkeletonBuilder({
      context,
      depth: template.depth,
      engine: TEST_ENGINE,
      missionId: "mission-1",
      offer,
      seed: "mission-seed",
      template,
    }).build();
    const rootEdges = nodes[ROOT_NODE_ID]!.choices!;

    expect(rootEdges.every((edge) => edge.gear?.item?.id === "strong-charge")).toBe(
      true,
    );
    expect(
      rootEdges.every(
        (edge) => edge.checkBreakdown?.consumablePowerBonus === 1,
      ),
    ).toBe(true);
    expect(SkeletonBuilder.reservationsForSubtree(nodes)).toEqual({
      "small-charge": 1,
      "strong-charge": 1,
    });
    const consumed = consumeMissionGear(player, rootEdges[0]!, NOW);
    expect(consumed.consumed).toBe(true);
    expect(consumed.player.stash).toMatchObject([
      { id: "small-charge", quantity: 1 },
    ]);
    expect(player.stash).toHaveLength(2);
    for (const edge of rootEdges) {
      expect(
        nodes[edge.id]!.choices!.every(
          (child) => child.gear?.item?.id === "small-charge",
        ),
      ).toBe(true);
    }
  });

  it("keeps consumed explosive power on matching edges only", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      hand: { id: "weapon", name: "Weapon", power: 30, slot: "hand" },
    });
    player.stash = [
      {
        consumable: true,
        id: "strong-charge",
        name: "Strong Charge",
        power: 38,
        quantity: TEST_TEMPLATE.depth,
        tags: ["explosive"],
      },
    ];
    const template: MissionTemplate = {
      ...TEST_TEMPLATE,
      gear: [
        {
          approaches: ["force"],
          chance: 1,
          consumes: true,
          label: "Explosive",
          tags: ["explosive"],
        },
      ],
    };
    const context = PlayerContextService.fromPlayer(player);
    const offer = JobOfferBuilder.buildOffers(
      context,
      "isolated-power-board",
      [template],
      TEST_ENGINE,
    )[0]!;
    const nodes = new SkeletonBuilder({
      context,
      depth: template.depth,
      engine: TEST_ENGINE,
      missionId: "isolated-power-mission",
      offer,
      seed: "isolated-power-seed",
      template,
    }).build();
    const edges = Object.values(nodes).flatMap((node) => node.choices ?? []);
    const consuming = edges.filter((edge) => edge.gear?.consumes);
    const ordinary = edges.filter((edge) => edge.gear === null);

    expect(context.effectivePower).toBe(32);
    expect(consuming.length).toBeGreaterThan(0);
    expect(ordinary.length).toBeGreaterThan(0);
    expect(
      consuming.every(
        (edge) =>
          edge.gear?.item?.id === "strong-charge" &&
          edge.checkBreakdown?.consumablePowerBonus === 1,
      ),
    ).toBe(true);
    expect(
      ordinary.every(
        (edge) => edge.checkBreakdown?.consumablePowerBonus === 0,
      ),
    ).toBe(true);
  });

  it("uses accepted armor for deterministic soak and keeps health above zero", () => {
    expect(HealthService.damageForFailure(25, 6)).toEqual({
      absorbed: 1,
      healthLost: 4,
      incoming: 5,
    });
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    player.resources.health = 2;
    const damaged = HealthService.applyDamage(
      player,
      HealthService.damageAtCurrentHealth(
        { absorbed: 0, healthLost: 10, incoming: 10 },
        player.resources.health,
      ),
      NOW,
    );
    expect(damaged.resources.health).toBe(1);
    expect(
      HealthService.damageAtCurrentHealth(
        { absorbed: 0, healthLost: 10, incoming: 10 },
        player.resources.health,
      ),
    ).toEqual({ absorbed: 0, healthLost: 1, incoming: 10 });
    expect(
      HealthService.heal(damaged, MAX_HEALTH, NOW).resources.health,
    ).toBe(MAX_HEALTH);
  });

  it("recovers ten Health per idle hour without exceeding the maximum", () => {
    expect(
      recoveredHealth(60, NOW, "2026-07-10T13:00:00.000Z"),
    ).toBe(70);
    expect(
      recoveredHealth(95, NOW, "2026-07-10T14:00:00.000Z"),
    ).toBe(MAX_HEALTH);
    expect(recoveredHealth(60, NOW, NOW)).toBe(60);
  });

  it("keeps weapon type out of skill selection", () => {
    const knife = createNewPlayer("knife", "Knife", NOW, {
      hand: { category: "melee", id: "knife", name: "Knife", power: 30 },
    });
    const pistol = createNewPlayer("pistol", "Pistol", NOW, {
      hand: { category: "pistol", id: "pistol", name: "Pistol", power: 30 },
    });
    const knifeContext = PlayerContextService.fromPlayer(knife);
    const pistolContext = PlayerContextService.fromPlayer(pistol);

    expect(
      MomentumService.passChance(
        knifeContext,
        "charisma",
        "charm",
        20,
        TEST_ENGINE,
      ),
    ).toBe(
      MomentumService.passChance(
        pistolContext,
        "charisma",
        "charm",
        20,
        TEST_ENGINE,
      ),
    );
  });

  it("applies and attributes equipped skill effects only to their skill", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      torso: {
        armor: 114,
        effects: [{ skill: "leadership", type: "skillBonus", value: 12 }],
        id: "dons-armored-topcoat",
        name: "Don's Armored Topcoat",
        power: 57,
      },
    });
    const context = PlayerContextService.fromPlayer(player);
    const leadership = MomentumService.checkBreakdown(
      context,
      "leadership",
      "social",
      50,
      TEST_ENGINE,
    );
    const stealth = MomentumService.checkBreakdown(
      context,
      "stealth",
      "quiet",
      50,
      TEST_ENGINE,
    );

    expect(leadership.equipmentSkillBonus).toBe(12);
    expect(stealth.equipmentSkillBonus).toBe(0);
  });

  it("keeps the accepted loadout snapshot unchanged after live gear changes", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      torso: {
        armor: 114,
        effects: [{ skill: "leadership", type: "skillBonus", value: 12 }],
        id: "dons-armored-topcoat",
        name: "Don's Armored Topcoat",
        power: 57,
      },
    });
    const accepted = PlayerContextService.acceptedState(player, TEST_TEMPLATE);

    player.loadout.torso = {
      armor: 1,
      id: "replacement",
      name: "Replacement",
      power: 1,
    };

    expect(accepted).toMatchObject({
      armor: 114,
      characterPower: 2,
      equipmentPower: 57,
      loadout: {
        torso: {
          effects: [
            { skill: "leadership", type: "skillBonus", value: 12 },
          ],
          id: "dons-armored-topcoat",
        },
      },
      totalPower: 59,
    });
    expect(PlayerContextService.fromPlayer(player)).toMatchObject({
      armor: 1,
      equipmentPower: 1,
    });
  });

  it("normalizes legacy Health and equipment copies", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    player.loadout = {
      hand: {
        effects: [{ approach: "quiet", type: "approachBonus", value: 10 }],
        id: "whisper-scope",
        name: "Whisper Scope",
        power: 166,
        slot: "hand",
        tags: ["silenced", "sniper"],
      },
      waist: {
        id: "leather-holster",
        name: "Leather Holster",
        power: 2,
        slot: "waist",
      },
    };
    player.stash = [
      { id: "buckshot-shells", name: "Buckshot Shells" },
      { id: "crowbar", name: "Crowbar" },
      {
        category: "tool",
        id: "crowbar",
        name: "Crowbar",
        price: 125,
        quantity: 2,
        tags: ["crowbar"],
      },
      {
        id: "first-aid-tin",
        name: "First-Aid Tin",
        tags: ["medkit"],
      },
      {
        category: "tool",
        id: "future-stash-tool",
        name: "Future Stash Tool",
        slot: null as never,
        tags: ["hacking"],
      },
      { id: "getaway-car-keys", name: "Getaway Car Keys" },
    ];
    const legacy = structuredClone(player);
    delete (legacy.resources as Partial<typeof legacy.resources>).health;

    const normalized = normalizePlayer(legacy as typeof player);
    expect(normalized.resources.health).toBe(MAX_HEALTH);
    expect(normalized.loadout.hand).toMatchObject({
      id: "whisper-scope",
      power: 166,
    });
    expect(normalized.loadout.hand).not.toHaveProperty("effects");
    expect(normalized.loadout.hand).not.toHaveProperty("tags");
    expect(normalized.loadout.waist?.armor).toBe(2);
    expect(normalized.stash).toHaveLength(4);
    expect(normalized.stash).toMatchObject([
      {
        category: "tool",
        consumable: true,
        id: "crowbar",
        price: 125,
        quantity: 3,
        tags: ["crowbar"],
      },
      {
        consumable: true,
        id: "first-aid-tin",
        quantity: 1,
        use: { health: 25 },
      },
      { consumable: true, id: "future-stash-tool", quantity: 1 },
      { consumable: true, id: "getaway-car-keys", quantity: 1 },
    ]);
    expect(normalized.stash[1]).not.toHaveProperty("tags");
    expect(normalized.stash[2]).toMatchObject({
      consumable: true,
      id: "future-stash-tool",
      quantity: 1,
    });
  });

  it("repairs invalid consumable quantities while merging legacy stacks", () => {
    const player = createNewPlayer("invalid-quantity", "Invalid Quantity", NOW);
    player.stash = [
      { id: "lockpick-set", name: "Lockpick Set", quantity: -2 },
      { id: "lockpick-set", name: "Lockpick Set", quantity: 1.5 },
      {
        id: "lockpick-set",
        name: "Lockpick Set",
        quantity: Number.POSITIVE_INFINITY,
      },
    ];

    expect(normalizePlayer(player).stash).toMatchObject([
      { consumable: true, id: "lockpick-set", quantity: 3 },
    ]);
  });
});
