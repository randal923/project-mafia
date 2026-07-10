import { describe, expect, it } from "vitest";
import {
  JOB_APPROACHES,
  JobOffer,
  MissionNode,
  OUTCOME_TIERS,
  OutcomeTier,
} from "../../../../shared/job";
import { createNewPlayer } from "../../../../shared/player";
import { JobCalculatorService } from "../JobCalculatorService";
import { JobOfferBuilder } from "../JobOfferBuilder";
import { MissionRng } from "../MissionRng";
import { MomentumService } from "../MomentumService";
import { PlayerContextService } from "../PlayerContextService";
import { RewardService } from "../RewardService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../SkeletonBuilder";
import { TEST_ENGINE, TEST_TEMPLATE } from "./fixtures";

const NOW = "2026-07-09T12:00:00.000Z";
const SEED = "0123456789abcdef0123456789abcdef";
const MISSION_ID = "mission-golden-1";

function freshContext() {
  return PlayerContextService.fromPlayer(
    createNewPlayer("uid-1", "Test Player", NOW),
  );
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

describe("MomentumService", () => {
  it("clamps pass chance to 5-95", () => {
    expect(MomentumService.passChance(0, 10, 0, 100, TEST_ENGINE)).toBe(5);
    expect(MomentumService.passChance(10, 1, 100, 0, TEST_ENGINE)).toBe(95);
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

  it("awards ±2 momentum, ±3 on criticals", () => {
    expect(MomentumService.momentumDelta(MomentumService.resolveCheck(30, 60), TEST_ENGINE)).toBe(2);
    expect(MomentumService.momentumDelta(MomentumService.resolveCheck(10, 60), TEST_ENGINE)).toBe(3);
    expect(MomentumService.momentumDelta(MomentumService.resolveCheck(70, 60), TEST_ENGINE)).toBe(-2);
    expect(MomentumService.momentumDelta(MomentumService.resolveCheck(100, 60), TEST_ENGINE)).toBe(-3);
  });

  it("partitions every reachable momentum into exactly one tier (depth 3-5)", () => {
    for (let depth = 3; depth <= 5; depth += 1) {
      const max = 3 * depth;
      for (let m = -max; m <= max; m += 1) {
        const tier = MomentumService.tierForMomentum(m, depth, TEST_ENGINE);
        expect(OUTCOME_TIERS).toContain(tier);
      }
    }
  });

  it("matches the depth-3 tier bands", () => {
    const bands: Array<[number, OutcomeTier]> = [
      [9, "jackpot"],
      [7, "jackpot"],
      [6, "successful"],
      [5, "successful"],
      [4, "partially_successful"],
      [1, "partially_successful"],
      [0, "partial_failure"],
      [-4, "partial_failure"],
      [-5, "failure"],
      [-7, "failure"],
      [-8, "disaster"],
      [-9, "disaster"],
    ];
    for (const [momentum, tier] of bands) {
      expect(MomentumService.tierForMomentum(momentum, 3, TEST_ENGINE)).toBe(tier);
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
});

describe("JobCalculatorService", () => {
  it("computes golden values for a fresh player", () => {
    // Fresh player: rank nobody (tier 0), power 2, empty loadout.
    expect(
      JobCalculatorService.calculate(freshContext(), TEST_TEMPLATE, TEST_ENGINE),
    ).toEqual({
      difficulty: 1,
      heatIncrease: 1,
      heatPressure: 0,
      powerTier: 0,
      rewardMax: 30,
      rewardMin: 20,
    });
  });
});

describe("JobOfferBuilder", () => {
  it("builds 3 deterministic offers with distinct premises", () => {
    const offers = JobOfferBuilder.buildOffers(
      freshContext(),
      SEED,
      [TEST_TEMPLATE],
      TEST_ENGINE,
    );
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((o) => o.storySeed.premise)).size).toBe(3);
    expect(new Set(offers.map((o) => o.id)).size).toBe(3);
    expect(offers.every((o) => o.templateId === TEST_TEMPLATE.id)).toBe(true);
    expect(offers).toEqual(
      JobOfferBuilder.buildOffers(freshContext(), SEED, [TEST_TEMPLATE], TEST_ENGINE),
    );
  });

  it("puts every mission template on the board before repeating any", () => {
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
      expect(bolder.check.difficulty).toBeGreaterThanOrEqual(
        safer.check.difficulty,
      );

      for (const edge of node.choices!) {
        const child = nodes[edge.id]!;
        expect(child.depth).toBe(node.depth + 1);
        expect(child.momentum).toBe(node.momentum + edge.momentumDelta);
        expect(edge.momentumDelta).toBe(MomentumService.momentumDelta(edge.roll, TEST_ENGINE));
        expect(edge.check.difficulty).toBeGreaterThanOrEqual(1);
        expect(edge.check.difficulty).toBeLessThanOrEqual(10);
        expect(edge.label).toBeNull();
      }
    }
  });
});

describe("RewardService", () => {
  const offer = goldenOffer();

  const forTier = (tier: OutcomeTier) =>
    RewardService.rewardsForTier(tier, offer, TEST_TEMPLATE);

  it("pays by tier from engine numbers only", () => {
    expect(forTier("jackpot").cashChange).toBe(45);
    expect(forTier("successful").cashChange).toBe(offer.rewardMax);
    expect(forTier("partially_successful").cashChange).toBe(25);
    expect(forTier("partial_failure").cashChange).toBe(10);
    expect(forTier("failure").cashChange).toBe(0);
    expect(forTier("disaster").cashChange).toBe(0);
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
    expect(applied.resources.heat).toBe(100);
    expect(applied.resources.cash).toBe(0);
    expect(applied.progression.experience).toBe(5);
  });
});
