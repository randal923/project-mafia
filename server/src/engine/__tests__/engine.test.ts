import { describe, expect, it } from "vitest";
import {
  JOB_APPROACHES,
  JobOffer,
  MissionNode,
  OUTCOME_TIERS,
  OutcomeTier,
} from "../../../../shared/job";
import {
  intoxicationPenalty,
  toleranceMultiplier,
} from "../../../../shared/intoxication";
import {
  applyPlayerExperience,
  applySkillExperience,
  rankForLevel,
  xpToNextLevel,
} from "../../../../shared/leveling";
import { PlayerItem, createNewPlayer } from "../../../../shared/player";
import { HealthService } from "../HealthService";
import { JobCalculatorService } from "../JobCalculatorService";
import { roundToFive } from "../math";
import { JobOfferBuilder } from "../JobOfferBuilder";
import { MissionRng } from "../MissionRng";
import { MomentumService } from "../MomentumService";
import {
  EnginePlayerContext,
  PlayerContextService,
} from "../PlayerContextService";
import { RewardService } from "../RewardService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../SkeletonBuilder";
import { TEST_ENGINE, TEST_TEMPLATE, TEST_TEMPLATE_WITH_GEAR } from "./fixtures";

const NOW = "2026-07-09T12:00:00.000Z";
const SEED = "0123456789abcdef0123456789abcdef";
const MISSION_ID = "mission-golden-1";

const FLASHBANG: PlayerItem = {
  consumable: true,
  id: "flashbang-mk1",
  name: "Flashbang",
  quantity: 1,
  tags: ["flashbang"],
};

function freshContext(): EnginePlayerContext {
  return PlayerContextService.fromPlayer(
    createNewPlayer("uid-1", "Test Player", NOW),
  );
}

function contextWith(
  overrides: Partial<EnginePlayerContext>,
): EnginePlayerContext {
  return {
    armor: 0,
    bonuses: { approachBonus: {}, heatReduction: 0, skillBonus: {} },
    characterPower: 0,
    drunk: 0,
    effectivePower: 0,
    equipmentPower: 0,
    gearItems: [],
    gearTags: {},
    heat: 0,
    high: 0,
    level: 1,
    rankTier: 0,
    skills: {
      charisma: 0,
      corruption: 0,
      leadership: 0,
      muscle: 0,
      stealth: 0,
      strategy: 0,
      tech: 0,
    },
    ...overrides,
  };
}

function goldenOffer(): JobOffer {
  return JobOfferBuilder.buildOffers(freshContext(), SEED, [TEST_TEMPLATE], TEST_ENGINE)[0]!;
}

function goldenSkeleton(): Record<string, MissionNode> {
  return new SkeletonBuilder({
    context: freshContext(),
    depth: 3,
    engine: TEST_ENGINE,
    missionId: MISSION_ID,
    offer: goldenOffer(),
    seed: SEED,
    template: TEST_TEMPLATE,
  }).build();
}

describe("MissionRng", () => {
  it("is deterministic and rolls within 1-100", () => {
    const rng = new MissionRng(SEED, MISSION_ID);
    for (let i = 0; i < 200; i += 1) {
      const roll = rng.rollD100(`scope-${i}`);
      expect(roll).toBe(rng.rollD100(`scope-${i}`));
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(100);
    }
  });

  it("picks distinct items deterministically", () => {
    const rng = new MissionRng(SEED, MISSION_ID);
    const picked = rng.pickDistinct(JOB_APPROACHES, 2, "x");
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    expect(picked).toEqual(rng.pickDistinct(JOB_APPROACHES, 2, "x"));
  });
});

describe("leveling (shared/leveling.ts)", () => {
  it("needs 150 XP at level 1 and rises steeply toward the cap", () => {
    expect(xpToNextLevel(1)).toBe(150);
    expect(xpToNextLevel(50)).toBeGreaterThan(2500);
    expect(xpToNextLevel(99)).toBeGreaterThan(9000);
  });

  it("levels up and carries the overflow", () => {
    const result = applyPlayerExperience(1, 0, xpToNextLevel(1) + 10);
    expect(result.level).toBe(2);
    expect(result.experience).toBe(10);
    expect(result.levelsGained).toBe(1);
  });

  it("cashes multiple level-ups from one big gain", () => {
    const result = applyPlayerExperience(
      1,
      0,
      xpToNextLevel(1) + xpToNextLevel(2) + 5,
    );
    expect(result.level).toBe(3);
    expect(result.experience).toBe(5);
    expect(result.levelsGained).toBe(2);
  });

  it("caps at level 100", () => {
    const result = applyPlayerExperience(99, 0, 1_000_000);
    expect(result.level).toBe(100);
    expect(result.experience).toBe(0);
    expect(result.rank).toBe("city_kingpin");
  });

  it("derives rank from level", () => {
    expect(rankForLevel(1)).toBe("nobody");
    expect(rankForLevel(10)).toBe("street_hustler");
    expect(rankForLevel(25)).toBe("crew_leader");
    expect(rankForLevel(40)).toBe("local_boss");
    expect(rankForLevel(55)).toBe("district_boss");
    expect(rankForLevel(70)).toBe("crime_lord");
    expect(rankForLevel(85)).toBe("city_kingpin");
  });

  it("converts every 100 skill XP into a level and resets the bar", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    const one = applySkillExperience(
      player.progression.skills,
      player.progression.skillExperience,
      "stealth",
      100,
    );
    expect(one.skills.stealth).toBe(2);
    expect(one.skillExperience.stealth).toBe(0);
    expect(one.levelsGained).toBe(1);

    const two = applySkillExperience(one.skills, one.skillExperience, "stealth", 250);
    expect(two.skills.stealth).toBe(4);
    expect(two.skillExperience.stealth).toBe(50);
    expect(two.levelsGained).toBe(2);
  });

  it("caps skills at 100 and stops banking XP", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    const result = applySkillExperience(
      { ...player.progression.skills, stealth: 99 },
      { ...player.progression.skillExperience, stealth: 90 },
      "stealth",
      5_000,
    );
    expect(result.skills.stealth).toBe(100);
    expect(result.skillExperience.stealth).toBe(0);
  });
});

describe("intoxication (shared/intoxication.ts)", () => {
  it("tolerance scales dose effectiveness down to 40% at max buzz", () => {
    expect(toleranceMultiplier(0)).toBe(1);
    expect(toleranceMultiplier(50)).toBeCloseTo(0.7);
    expect(toleranceMultiplier(100)).toBeCloseTo(0.4);
    expect(toleranceMultiplier(500)).toBeCloseTo(0.4); // clamped
  });

  it("penalty stacks high and drunk, 1% per 10 points each", () => {
    expect(intoxicationPenalty(0, 0)).toBe(0);
    expect(intoxicationPenalty(9, 9)).toBe(0);
    expect(intoxicationPenalty(100, 100)).toBe(20);
  });
});

describe("MomentumService", () => {
  it("clamps pass chance to 5-95", () => {
    expect(
      MomentumService.passChance(
        contextWith({ heat: 100 }),
        "stealth",
        "quiet",
        100,
        TEST_ENGINE,
      ),
    ).toBe(5);
    expect(
      MomentumService.passChance(
        contextWith({
          effectivePower: 500,
          skills: { ...contextWith({}).skills, stealth: 100 },
        }),
        "stealth",
        "quiet",
        1,
        TEST_ENGINE,
      ),
    ).toBe(95);
  });

  it("adds equipped skill and approach bonuses", () => {
    const base = MomentumService.passChance(
      contextWith({}),
      "stealth",
      "quiet",
      50,
      TEST_ENGINE,
    );
    const boosted = MomentumService.passChance(
      contextWith({
        bonuses: {
          approachBonus: { quiet: 4 },
          heatReduction: 0,
          skillBonus: { stealth: 6 },
        },
      }),
      "stealth",
      "quiet",
      50,
      TEST_ENGINE,
    );
    expect(boosted).toBe(base + 10);
  });

  it("debuffs checks while high or drunk", () => {
    const sober = MomentumService.passChance(
      contextWith({}),
      "stealth",
      "quiet",
      20,
      TEST_ENGINE,
    );
    const wasted = MomentumService.passChance(
      contextWith({ drunk: 45, high: 60 }),
      "stealth",
      "quiet",
      20,
      TEST_ENGINE,
    );
    expect(wasted).toBe(sober - intoxicationPenalty(60, 45));
    expect(intoxicationPenalty(60, 45)).toBe(10); // 6 + 4
  });

  it("keeps armor out of pass chance and uses it for damage soak", () => {
    const unarmored = contextWith({ armor: 0 });
    const armored = contextWith({ armor: 45 });
    expect(
      MomentumService.passChance(armored, "muscle", "force", 50, TEST_ENGINE),
    ).toBe(
      MomentumService.passChance(unarmored, "muscle", "force", 50, TEST_ENGINE),
    );
    expect(HealthService.damageForFailure(50, 45)).toEqual({
      absorbed: 2,
      healthLost: 8,
      incoming: 10,
    });
  });

  it("maps rolls to pass/fail with margins", () => {
    expect(MomentumService.resolveCheck(30, 60)).toEqual({
      margin: 30,
      passChance: 60,
      passed: true,
      value: 30,
    });
    expect(MomentumService.resolveCheck(90, 60).passed).toBe(false);
  });

  it("awards stakes-scaled momentum, criticals adding ±1", () => {
    const pass = MomentumService.resolveCheck(30, 60);
    const critPass = MomentumService.resolveCheck(10, 60);
    const fail = MomentumService.resolveCheck(70, 60);
    const critFail = MomentumService.resolveCheck(100, 60);
    expect(MomentumService.momentumDelta(pass, "safer", TEST_ENGINE)).toBe(1);
    expect(MomentumService.momentumDelta(critPass, "safer", TEST_ENGINE)).toBe(2);
    expect(MomentumService.momentumDelta(fail, "safer", TEST_ENGINE)).toBe(-1);
    expect(MomentumService.momentumDelta(critFail, "safer", TEST_ENGINE)).toBe(-2);
    expect(MomentumService.momentumDelta(pass, "bolder", TEST_ENGINE)).toBe(3);
    expect(MomentumService.momentumDelta(critPass, "bolder", TEST_ENGINE)).toBe(4);
    expect(MomentumService.momentumDelta(fail, "bolder", TEST_ENGINE)).toBe(-3);
    expect(MomentumService.momentumDelta(critFail, "bolder", TEST_ENGINE)).toBe(-4);
  });

  it("partitions every reachable momentum into exactly one tier (depth 3-5)", () => {
    for (let depth = 3; depth <= 5; depth += 1) {
      const max = 4 * depth;
      for (let m = -max; m <= max; m += 1) {
        const tier = MomentumService.tierForMomentum(m, depth, TEST_ENGINE);
        expect(OUTCOME_TIERS).toContain(tier);
      }
    }
  });

  it("matches the depth-3 tier bands", () => {
    // safer.pass=1, bolder.pass=3 → perfectSafe=3, midline=6 at depth 3.
    const bands: Array<[number, OutcomeTier]> = [
      [9, "jackpot"],
      [7, "jackpot"],
      [6, "successful"],
      [3, "successful"],
      [2, "partially_successful"],
      [1, "partially_successful"],
      [0, "partial_failure"],
      [-3, "partial_failure"],
      [-4, "failure"],
      [-6, "failure"],
      [-7, "disaster"],
      [-9, "disaster"],
    ];
    for (const [momentum, tier] of bands) {
      expect(MomentumService.tierForMomentum(momentum, 3, TEST_ENGINE)).toBe(tier);
    }
  });

  it("caps a perfect all-safe run at successful and floors all-safe fails above prison", () => {
    for (let depth = 3; depth <= 5; depth += 1) {
      const allSafePass = TEST_ENGINE.momentum.safer.pass * depth;
      const allSafeFail = TEST_ENGINE.momentum.safer.fail * depth;
      expect(
        MomentumService.tierForMomentum(allSafePass, depth, TEST_ENGINE),
      ).toBe("successful");
      // Even with a critical on every beat, safe play cannot jackpot…
      expect(
        MomentumService.tierForMomentum(
          allSafePass + TEST_ENGINE.momentum.criticalBonus * depth,
          depth,
          TEST_ENGINE,
        ),
      ).not.toBe("jackpot");
      // …and cannot end in disaster.
      expect(
        MomentumService.tierForMomentum(
          allSafeFail - TEST_ENGINE.momentum.criticalBonus * depth,
          depth,
          TEST_ENGINE,
        ),
      ).not.toBe("disaster");
    }
  });

  it("lets all-bold runs reach jackpot and disaster", () => {
    for (let depth = 3; depth <= 5; depth += 1) {
      expect(
        MomentumService.tierForMomentum(
          TEST_ENGINE.momentum.bolder.pass * depth,
          depth,
          TEST_ENGINE,
        ),
      ).toBe("jackpot");
      expect(
        MomentumService.tierForMomentum(
          TEST_ENGINE.momentum.bolder.fail * depth,
          depth,
          TEST_ENGINE,
        ),
      ).toBe("disaster");
    }
  });
});

describe("PlayerContextService", () => {
  it("computes power as base plus equipped item power (2 + 3 = 5)", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      hand: { id: "stiletto-knife", name: "Stiletto Knife", power: 3 },
    });
    expect(PlayerContextService.fromPlayer(player).effectivePower).toBe(5);
  });

  it("counts an empty loadout as base power only", () => {
    expect(freshContext().effectivePower).toBe(2);
  });

  it("indexes gear tags across loadout and stash", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      waist: {
        armor: 10,
        id: "scanner-belt",
        name: "Scanner Belt",
        power: 20,
        tags: ["scanner"],
      },
    });
    player.stash = [
      { ...FLASHBANG, quantity: 3 },
      {
        consumable: true,
        id: "crowbar",
        name: "Crowbar",
        quantity: 1,
        tags: ["crowbar"],
      },
    ];
    const { gearTags } = PlayerContextService.fromPlayer(player);
    expect(gearTags.scanner).toEqual({ consumables: 0, permanent: true });
    expect(gearTags.flashbang).toEqual({ consumables: 3, permanent: false });
    expect(gearTags.crowbar).toEqual({ consumables: 1, permanent: false });
  });
});

describe("JobCalculatorService", () => {
  it("computes golden values for a fresh level-1 player", () => {
    expect(
      JobCalculatorService.calculate(freshContext(), TEST_TEMPLATE, TEST_ENGINE),
    ).toEqual({
      difficulty: 2,
      heatIncrease: 1,
      heatPressure: 0,
      rewardMax: 95,
      rewardMin: 70,
    });
  });

  it("charges more stamina for deeper and harder jobs", () => {
    // round(8 + 4×(depth−3) + 0.18×difficulty)
    expect(JobCalculatorService.staminaCost(TEST_TEMPLATE, 5, TEST_ENGINE)).toBe(9);
    expect(
      JobCalculatorService.staminaCost({ ...TEST_TEMPLATE, depth: 5 }, 90, TEST_ENGINE),
    ).toBe(32);
    // A template's own staminaCost wins (lay-low).
    expect(
      JobCalculatorService.staminaCost(
        { ...TEST_TEMPLATE, staminaCost: 5 },
        90,
        TEST_ENGINE,
      ),
    ).toBe(5);
  });

  it("stretches difficulty and pay as the player outlevels the band floor", () => {
    const calculations = JobCalculatorService.calculate(
      contextWith({ level: 8, skills: freshContext().skills }),
      TEST_TEMPLATE,
      TEST_ENGINE,
    );
    expect(calculations.difficulty).toBe(9); // base 2 + 7 levels into band
    expect(calculations.rewardMin).toBe(420); // 20 + 50×8
  });
});

describe("JobOfferBuilder", () => {
  it("builds a full deterministic board with distinct premises", () => {
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      [TEST_TEMPLATE],
      TEST_ENGINE,
    );
    expect(offers).toHaveLength(TEST_ENGINE.board.size);
    expect(new Set(offers.map((o) => o.storySeed.premise)).size).toBe(offers.length);
    expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length);
    expect(offers.every((o) => o.templateId === TEST_TEMPLATE.id)).toBe(true);
    expect(offers).toEqual(
      JobOfferBuilder.buildOffers(freshContext(), SEED, [TEST_TEMPLATE], TEST_ENGINE),
    );
  });

  it("puts every eligible template on the board before repeating any", () => {
    const templates = [
      TEST_TEMPLATE,
      { ...TEST_TEMPLATE, id: "test-store" },
      { ...TEST_TEMPLATE, id: "test-bank" },
    ];
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      templates,
      TEST_ENGINE,
    );
    expect(new Set(offers.map((o) => o.templateId))).toEqual(
      new Set(["test-robbery", "test-store", "test-bank"]),
    );
  });

  it("hides templates written for higher level bands", () => {
    const high = {
      ...TEST_TEMPLATE,
      id: "test-high",
      levels: { max: 30, min: 20 },
    };
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      [TEST_TEMPLATE, high],
      TEST_ENGINE,
    );
    expect(offers.every((o) => o.templateId === TEST_TEMPLATE.id)).toBe(true);
  });

  it("drops templates the player has outgrown past the grace window", () => {
    const level30 = contextWith({ level: 30, skills: freshContext().skills });
    const high = {
      ...TEST_TEMPLATE,
      id: "test-high",
      levels: { max: 40, min: 25 },
    };
    // TEST_TEMPLATE band is 1-10; grace 15 → gone at level 30.
    const offers = JobOfferBuilder.buildOffers(
      level30,
      SEED,
      [TEST_TEMPLATE, high],
      TEST_ENGINE,
    );
    expect(offers.every((o) => o.templateId === "test-high")).toBe(true);
  });

  it("always adds an eligible lay-low template as an extra offer", () => {
    const layLow = {
      ...TEST_TEMPLATE,
      id: "lay-low",
      levels: { max: 100, min: 1 },
      type: "lay_low",
    };
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      [TEST_TEMPLATE, layLow],
      TEST_ENGINE,
    );
    expect(offers.filter((o) => o.templateId === "lay-low")).toHaveLength(1);
    expect(offers).toHaveLength(TEST_ENGINE.board.size + 1);
  });

  it("describes gear consumption from the player's strongest matching item", () => {
    const context = contextWith({
      gearItems: [
        {
          consumable: false,
          id: "reusable-flash-tool",
          name: "Reusable Flash Tool",
          power: 10,
          quantity: 1,
          tags: ["flashbang"],
        },
      ],
      level: 1,
      skills: freshContext().skills,
    });
    const offer = JobOfferBuilder.buildOffers(
      context,
      SEED,
      [TEST_TEMPLATE_WITH_GEAR],
      TEST_ENGINE,
    )[0]!;

    expect(offer.gear?.[0]).toMatchObject({ consumes: false });
  });

  it("falls back to the nearest bands when nothing matches", () => {
    const high = {
      ...TEST_TEMPLATE,
      id: "test-high",
      levels: { max: 60, min: 50 },
    };
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      [high],
      TEST_ENGINE,
    );
    expect(offers).toHaveLength(TEST_ENGINE.board.size);
    expect(offers.every((o) => o.templateId === "test-high")).toBe(true);
  });
});

describe("SkeletonBuilder", () => {
  it("derives child and parent node ids", () => {
    expect(SkeletonBuilder.childNodeId(ROOT_NODE_ID, 0)).toBe("0");
    expect(SkeletonBuilder.childNodeId("0", 1)).toBe("01");
    expect(SkeletonBuilder.parentNodeId("01")).toBe("0");
    expect(SkeletonBuilder.parentNodeId("0")).toBe(ROOT_NODE_ID);
    expect(SkeletonBuilder.parentNodeId(ROOT_NODE_ID)).toBeNull();
  });

  it("builds a full depth-3 tree: 7 beats + 8 outcomes", () => {
    const nodes = goldenSkeleton();
    const beats = Object.values(nodes).filter((n) => n.kind === "beat");
    const outcomes = Object.values(nodes).filter((n) => n.kind === "outcome");
    expect(Object.keys(nodes)).toHaveLength(15);
    expect(beats).toHaveLength(7);
    expect(outcomes).toHaveLength(8);
    expect(nodes[ROOT_NODE_ID]!.momentum).toBe(0);
  });

  it("is fully deterministic for a fixed seed", () => {
    expect(goldenSkeleton()).toEqual(goldenSkeleton());
  });

  it("changes rolls when the seed changes", () => {
    const other = new SkeletonBuilder({
      context: freshContext(),
      depth: 3,
      engine: TEST_ENGINE,
      missionId: MISSION_ID,
      offer: goldenOffer(),
      seed: "ffffffffffffffffffffffffffffffff",
      template: TEST_TEMPLATE,
    }).build();
    const rolls = (nodes: Record<string, MissionNode>) =>
      Object.values(nodes)
        .flatMap((n) => n.choices ?? [])
        .map((c) => c.roll.value)
        .join(",");
    expect(rolls(other)).not.toBe(rolls(goldenSkeleton()));
  });

  it("keeps momentum, tiers, and checks internally consistent", () => {
    const nodes = goldenSkeleton();

    for (const node of Object.values(nodes)) {
      if (node.kind === "outcome") {
        expect(node.choices).toBeNull();
        expect(node.outcomeTier).toBe(
          MomentumService.tierForMomentum(node.momentum, 3, TEST_ENGINE),
        );
        continue;
      }

      expect(node.choices).toHaveLength(2);
      expect(node.outcomeTier).toBeNull();
      const safer = node.choices![0]!;
      const bolder = node.choices![1]!;
      expect(safer.approach).not.toBe(bolder.approach);
      expect(safer.stakes).toBe("safer");
      expect(bolder.stakes).toBe("bolder");
      expect(bolder.check.difficulty).toBeGreaterThanOrEqual(
        safer.check.difficulty,
      );

      for (const edge of node.choices!) {
        const child = nodes[edge.id]!;
        const swing = TEST_ENGINE.momentum[edge.stakes!];
        const costs = TEST_ENGINE.approaches[edge.approach];
        expect(child.depth).toBe(node.depth + 1);
        expect(child.momentum).toBe(node.momentum + edge.momentumDelta);
        expect(edge.momentumDelta).toBe(
          MomentumService.momentumDelta(edge.roll, edge.stakes!, TEST_ENGINE),
        );
        expect(edge.momentumPreview).toEqual({
          fail: swing.fail,
          pass: swing.pass,
        });
        expect(edge.cashCost).toBe(
          roundToFive((costs.cashCostFactor ?? 0) * goldenOffer().rewardMax),
        );
        expect(edge.heatOnFail).toBe(costs.heatOnFail ?? 0);
        expect(edge.check.difficulty).toBeGreaterThanOrEqual(1);
        expect(edge.check.difficulty).toBeLessThanOrEqual(100);
        expect(edge.gear).toBeNull();
        expect(edge.label).toBeNull();
      }
    }
  });

  describe("gear", () => {
    function gearSkeleton(stash: PlayerItem[]): Record<string, MissionNode> {
      const player = createNewPlayer("uid-1", "Test Player", NOW);
      player.stash = stash;
      return new SkeletonBuilder({
        context: PlayerContextService.fromPlayer(player),
        depth: 3,
        engine: TEST_ENGINE,
        missionId: MISSION_ID,
        // Mid-band difficulty so gear modifiers never hit the 1-100 clamp.
        offer: { ...goldenOffer(), difficulty: 50 },
        seed: SEED,
        template: TEST_TEMPLATE_WITH_GEAR,
      }).build();
    }

    function edges(nodes: Record<string, MissionNode>) {
      return Object.values(nodes).flatMap((n) => n.choices ?? []);
    }

    it("keeps at most one unsatisfiable demand per beat so a path stays open", () => {
      const nodes = gearSkeleton([]);
      const beats = Object.values(nodes).filter((n) => n.kind === "beat");
      expect(beats.length).toBeGreaterThan(0);
      for (const beat of beats) {
        const locked = beat.choices!.filter(
          (edge) => edge.gear && !edge.gear.satisfied,
        );
        expect(locked.length).toBeLessThanOrEqual(1);
        // The waived edge carries no demand at all.
        expect(
          beat.choices!.some((edge) => edge.gear === null),
        ).toBe(true);
      }
    });

    it("carrying the gear eases the check by satisfiedBonus", () => {
      const withGear = edges(gearSkeleton([{ ...FLASHBANG, quantity: 99 }]));
      const bare = edges(
        new SkeletonBuilder({
          context: PlayerContextService.fromPlayer(
            createNewPlayer("uid-1", "Test Player", NOW),
          ),
          depth: 3,
          engine: TEST_ENGINE,
          missionId: MISSION_ID,
          offer: { ...goldenOffer(), difficulty: 50 },
          seed: SEED,
          template: { ...TEST_TEMPLATE_WITH_GEAR, gear: undefined },
        }).build(),
      );
      for (let i = 0; i < withGear.length; i += 1) {
        expect(bare[i]!.check.difficulty - withGear[i]!.check.difficulty).toBe(
          TEST_ENGINE.gear.satisfiedBonus,
        );
      }
    });

    it("a single consumable only satisfies one demand per path", () => {
      const nodes = gearSkeleton([{ ...FLASHBANG, quantity: 1 }]);
      // Root edges can spend the one flashbang…
      for (const edge of nodes[ROOT_NODE_ID]!.choices!) {
        expect(edge.gear!.satisfied).toBe(true);
        // …and further demands along the path find it spent: they either
        // lock one choice or are waived so the beat stays playable.
        for (const child of nodes[edge.id]!.choices!) {
          expect(child.gear?.satisfied ?? false).toBe(false);
        }
      }
    });

    it("an equippable reusable match satisfies every demand on the run", () => {
      const nodes = gearSkeleton([
        {
          id: "scanner-belt",
          name: "Scanner Belt",
          slot: "waist",
          tags: ["flashbang"],
        },
      ]);
      expect(edges(nodes).every((e) => e.gear!.satisfied)).toBe(true);
    });
  });
});

describe("RewardService", () => {
  const offer = goldenOffer();

  const forTier = (tier: OutcomeTier) =>
    RewardService.rewardsForTier(tier, offer, TEST_TEMPLATE);

  it("pays by tier from engine numbers only", () => {
    expect(forTier("jackpot").cashChange).toBe(145);
    expect(forTier("successful").cashChange).toBe(offer.rewardMax);
    expect(forTier("partially_successful").cashChange).toBe(75);
    expect(forTier("partial_failure").cashChange).toBe(25);
    expect(forTier("failure").cashChange).toBe(0);
    expect(forTier("disaster").cashChange).toBe(0);
  });

  it("scales XP from xpBase plus difficulty", () => {
    // successful: 1.5 × (30 + 2 × 6) = 63
    expect(forTier("successful").xpChange).toBe(63);
  });

  it("adds more heat the worse the outcome", () => {
    const heats = OUTCOME_TIERS.map((tier) => forTier(tier).heatChange);
    expect(heats[1]!).toBeLessThanOrEqual(heats[0]!); // successful is coolest
    for (let i = 1; i < heats.length - 1; i += 1) {
      expect(heats[i + 1]!).toBeGreaterThanOrEqual(heats[i]!);
    }
  });

  it("clamps heat to 0-100 and cash to >= 0 on apply", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    player.resources.heat = 98;
    const applied = RewardService.applyToPlayer(
      player,
      { cashChange: -50, heatChange: 10, xpChange: 5 },
      NOW,
    );
    expect(applied.player.resources.heat).toBe(100);
    expect(applied.player.resources.cash).toBe(0);
    expect(applied.player.progression.experience).toBe(5);
    expect(applied.levelsGained).toBe(0);
  });

  it("levels the player up when mission XP crosses the threshold", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    const applied = RewardService.applyToPlayer(
      player,
      { cashChange: 0, heatChange: 0, xpChange: xpToNextLevel(1) + 3 },
      NOW,
    );
    expect(applied.levelsGained).toBe(1);
    expect(applied.player.progression.level).toBe(2);
    expect(applied.player.progression.experience).toBe(3);
  });

  it("bleeds off heat for accepted heat-reduction effects", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW, {
      torso: {
        armor: 45,
        effects: [{ type: "heatReduction", value: 2 }],
        id: "vest",
        name: "Vest",
      },
    });
    const mitigated = RewardService.mitigateHeat(
      { cashChange: 0, heatChange: 10, xpChange: 0 },
      player.loadout,
    );
    expect(mitigated.heatChange).toBe(8);

    const floored = RewardService.mitigateHeat(
      { cashChange: 0, heatChange: 4, xpChange: 0 },
      player.loadout,
    );
    expect(floored.heatChange).toBe(2);
  });
});
