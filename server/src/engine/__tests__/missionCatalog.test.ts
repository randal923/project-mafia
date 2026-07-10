import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  equipmentCatalogSchema,
  equipmentToPlayerItem,
} from "../../../../shared/equipment";
import {
  APPROACH_SKILLS,
  ChoiceEdge,
  MissionNode,
} from "../../../../shared/job";
import { createNewPlayer } from "../../../../shared/player";
import { EngineConfigService } from "../../services/EngineConfigService";
import { MissionTemplateService } from "../../services/MissionTemplateService";
import { HealthService } from "../HealthService";
import { JobCalculatorService } from "../JobCalculatorService";
import { JobOfferBuilder } from "../JobOfferBuilder";
import { MomentumService } from "../MomentumService";
import { PlayerContextService } from "../PlayerContextService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../SkeletonBuilder";
import { consumeMissionGear } from "../consumeMissionGear";

const retiredAmmo = [
  "armor-piercing-rounds",
  "buckshot-shells",
  "incendiary-rounds",
  "match-grade-rounds",
  "steel-core-rounds",
  "tranquilizer-darts",
];

const addedMissions = [
  { depth: 3, id: "back-alley-collection", max: 7, min: 1 },
  { depth: 3, id: "bootlegger-truck-robbery", max: 12, min: 4 },
  { depth: 3, id: "riverside-card-game-shakedown", max: 18, min: 8 },
  { depth: 4, id: "union-payroll-theft", max: 25, min: 14 },
  { depth: 4, id: "speakeasy-takeover", max: 32, min: 20 },
  { depth: 4, id: "corrupt-cop-ledger", max: 40, min: 28 },
  { depth: 4, id: "train-yard-hijack", max: 48, min: 35 },
  { depth: 4, id: "nightclub-casino-robbery", max: 56, min: 42 },
  { depth: 5, id: "federal-evidence-transfer", max: 65, min: 50 },
  { depth: 5, id: "syndicate-arms-convoy", max: 74, min: 60 },
  { depth: 5, id: "hotel-summit-hit", max: 86, min: 72 },
  { depth: 5, id: "treasury-gold-transfer", max: 100, min: 84 },
];

const rebalancedMissions = [
  { gear: [], id: "corner-hustle", risks: ["force"] },
  { gear: [], id: "lay-low", risks: ["force"] },
  {
    gear: ["lockpick"],
    id: "downtown-convenience-store",
    risks: ["force"],
  },
  {
    gear: ["crowbar"],
    id: "chop-shop-run",
    risks: ["force", "opportunistic"],
  },
  {
    gear: ["lockpick"],
    id: "docks-robbery",
    risks: ["force", "quiet"],
  },
  {
    gear: ["breaching", "crowbar"],
    id: "warehouse-hijack",
    risks: ["force", "opportunistic", "technical"],
  },
  {
    gear: ["climbing", "disguise", "lockpick"],
    id: "jewelry-store-heist",
    risks: ["force", "opportunistic", "quiet"],
  },
  {
    gear: ["disguise", "flashbang"],
    id: "protection-racket-war",
    risks: ["force", "social"],
  },
  {
    gear: ["explosive", "flashbang"],
    id: "armored-car-ambush",
    risks: ["force", "opportunistic", "technical"],
  },
  {
    gear: ["disguise", "hacking"],
    id: "casino-skim",
    risks: ["deception", "force"],
  },
  {
    gear: ["breaching", "explosive", "getaway", "smoke"],
    id: "downtown-bank-heist",
    risks: ["force", "opportunistic", "quiet", "technical"],
  },
  {
    gear: ["flashbang", "scanner"],
    id: "rival-crew-takedown",
    risks: ["force", "opportunistic", "quiet"],
  },
  {
    gear: ["hacking", "lockpick", "scanner"],
    id: "evidence-vault-break-in",
    risks: ["force", "quiet", "technical"],
  },
  {
    gear: ["getaway", "jammer", "smoke"],
    id: "arms-deal-hijack",
    risks: ["force", "opportunistic", "quiet"],
  },
  {
    gear: ["breaching", "disguise", "explosive", "hacking"],
    id: "casino-vault-job",
    risks: ["force", "quiet", "technical"],
  },
  {
    gear: ["explosive", "flashbang"],
    id: "cartel-exchange-ambush",
    risks: ["force", "opportunistic", "quiet"],
  },
  {
    gear: ["breaching", "climbing", "explosive", "hacking", "jammer"],
    id: "central-bank-vault",
    risks: ["force", "opportunistic", "quiet", "technical"],
  },
];

type PathStep = {
  edge: ChoiceEdge;
  node: MissionNode;
};

function completePaths(
  nodes: Record<string, MissionNode>,
  nodeId = ROOT_NODE_ID,
): PathStep[][] {
  const node = nodes[nodeId];
  if (!node) {
    throw new Error(`Missing mission node ${nodeId}.`);
  }
  if (!node.choices) {
    return [[]];
  }

  return node.choices.flatMap((edge) =>
    completePaths(nodes, edge.id).map((path) => [
      { edge, node: nodes[edge.id]! },
      ...path,
    ]),
  );
}

describe("production mission and equipment contract", () => {
  const catalog = equipmentCatalogSchema.parse(
    JSON.parse(
      readFileSync(join(process.cwd(), "src", "seedData", "equipments.json"), "utf8"),
    ),
  );
  const templates = new MissionTemplateService(
    join(process.cwd(), "missions"),
  ).all();
  const engine = new EngineConfigService(
    join(process.cwd(), "missions", "_engine.yml"),
  ).config;

  it("ships the complete 29-mission roster", () => {
    expect(templates).toHaveLength(29);
    expect(templates.map((template) => template.id)).toEqual(
      expect.arrayContaining(addedMissions.map(({ id }) => id)),
    );
    for (const expected of addedMissions) {
      expect(templates.find(({ id }) => id === expected.id)).toMatchObject({
        depth: expected.depth,
        levels: { max: expected.max, min: expected.min },
        storySeeds: expect.arrayContaining([
          expect.objectContaining({
            location: expect.any(String),
            premise: expect.any(String),
            pressure: expect.any(String),
          }),
        ]),
      });
      expect(
        templates.find(({ id }) => id === expected.id)?.storySeeds,
      ).toHaveLength(4);
    }
  });

  it("covers every player level without relying on the evergreen lay-low job", () => {
    const regularTemplates = templates.filter(
      (template) => template.type !== "lay_low",
    );

    for (let level = 1; level <= 100; level += 1) {
      expect(
        regularTemplates.some(
          (template) =>
            level >= template.levels.min && level <= template.levels.max,
        ),
        `level ${level}`,
      ).toBe(true);
    }
  });

  it("keeps the approved gear and Health-risk map on the original roster", () => {
    for (const expected of rebalancedMissions) {
      const template = templates.find(({ id }) => id === expected.id)!;
      expect(
        (template.gear ?? [])
          .flatMap((requirement) => requirement.tags)
          .sort(),
        `${expected.id} gear`,
      ).toEqual(expected.gear);
      expect(
        [...template.healthRisk.approaches].sort(),
        `${expected.id} Health risks`,
      ).toEqual(expected.risks);
    }
  });

  it.each(templates)("keeps $id formulas progressive across its band", (template) => {
    const atMin = createNewPlayer(`${template.id}-min`, "Minimum", "2026-07-10T12:00:00.000Z");
    atMin.progression.level = template.levels.min;
    const atMax = createNewPlayer(`${template.id}-max`, "Maximum", "2026-07-10T12:00:00.000Z");
    atMax.progression.level = template.levels.max;
    const minimum = JobCalculatorService.calculate(
      PlayerContextService.fromPlayer(atMin),
      template,
      engine,
    );
    const maximum = JobCalculatorService.calculate(
      PlayerContextService.fromPlayer(atMax),
      template,
      engine,
    );

    expect(maximum.difficulty).toBeGreaterThanOrEqual(minimum.difficulty);
    expect(maximum.rewardMin).toBeGreaterThanOrEqual(minimum.rewardMin);
    expect(maximum.rewardMax).toBeGreaterThanOrEqual(minimum.rewardMax);
    expect(minimum.rewardMax).toBeGreaterThanOrEqual(minimum.rewardMin);
    expect(maximum.rewardMax).toBeGreaterThanOrEqual(maximum.rewardMin);
    expect(maximum.heatIncrease).toBeGreaterThanOrEqual(minimum.heatIncrease);
    expect(maximum.heatIncrease).toBeLessThanOrEqual(template.heat.max);
  });

  it("retires ammunition and keeps every remaining item mechanically useful", () => {
    expect(catalog).toHaveLength(111);
    expect(catalog.some((item) => retiredAmmo.includes(item.id))).toBe(false);
    expect(catalog.some((item) => item.category === ("ammo" as never))).toBe(false);
    expect(
      catalog.every(
        (item) =>
          item.slot !== null || Boolean(item.use) || Boolean(item.tags?.length),
      ),
    ).toBe(true);
  });

  it("keeps hand weapons power-only and every wearable armored", () => {
    for (const item of catalog) {
      if (item.slot === "hand") {
        expect(item.power).toBeGreaterThan(0);
        expect(item.armor).toBeUndefined();
        expect(item.consumable).toBeUndefined();
        expect(item.effects).toBeUndefined();
        expect(item.tags).toBeUndefined();
        expect(item.use).toBeUndefined();
      } else if (item.slot !== null) {
        expect(item.power).toBeGreaterThan(0);
        expect(item.armor).toBeGreaterThan(0);
      }
    }
  });

  it("uses the approved waist armor progression", () => {
    expect(
      catalog
        .filter((item) => item.slot === "waist")
        .sort((a, b) => a.levelRequirement - b.levelRequirement)
        .map((item) => item.armor),
    ).toEqual([2, 4, 8, 12, 17, 21, 27]);
  });

  it("gives kits the approved healing values and no mission tag", () => {
    const firstAid = catalog.find((item) => item.id === "first-aid-tin");
    const surgeon = catalog.find((item) => item.id === "field-surgeon-kit");
    const trauma = catalog.find(
      (item) => item.id === "black-market-trauma-kit",
    );
    expect(firstAid).toMatchObject({ use: { health: 25 } });
    expect(surgeon).toMatchObject({ use: { health: 50 } });
    expect(trauma).toMatchObject({ use: { health: 100 } });
    expect(firstAid?.tags).toBeUndefined();
    expect(surgeon?.tags).toBeUndefined();
    expect(trauma?.tags).toBeUndefined();
  });

  it("covers every tactical tag with entry-level-valid mission gear", () => {
    const usedTags = new Set(
      templates.flatMap((template) =>
        (template.gear ?? []).flatMap((requirement) => requirement.tags),
      ),
    );
    const catalogTags = new Set(catalog.flatMap((item) => item.tags ?? []));
    expect(usedTags).toEqual(catalogTags);

    for (const tag of catalogTags) {
      const missionCount = templates.filter((template) =>
        (template.gear ?? []).some((requirement) =>
          requirement.tags.includes(tag),
        ),
      ).length;
      expect(missionCount, tag).toBeGreaterThanOrEqual(2);
    }

    for (const template of templates) {
      expect(template.healthRisk.approaches).toContain("force");
      for (const requirement of template.gear ?? []) {
        const providers = catalog.filter((item) =>
          item.tags?.some((tag) => requirement.tags.includes(tag)),
        );
        const firstProvider = Math.min(
          ...providers.map((item) => item.levelRequirement),
        );
        expect(firstProvider, `${template.id}: ${requirement.label}`).toBeLessThanOrEqual(
          template.levels.min,
        );
        const consumptionModes = new Set(
          providers.map((item) => item.consumable ?? false),
        );
        if (consumptionModes.size === 1) {
          expect(requirement.consumes).toBe([...consumptionModes][0]);
        }
      }
    }
  });

  it.each(
    templates.flatMap((template) =>
      [template.levels.min, template.levels.max].flatMap((level) => [
        { equipment: "unprepared" as const, level, template },
        { equipment: "prepared" as const, level, template },
      ]),
    ),
  )(
    "builds valid $template.id scenarios at level $level ($equipment)",
    ({ equipment, level, template }) => {
      const player = createNewPlayer(
        `${template.id}-${level}`,
        "Scenario Player",
        "2026-07-10T12:00:00.000Z",
      );
      player.progression.level = level;
      const relevantTags = new Set(
        (template.gear ?? []).flatMap((requirement) => requirement.tags),
      );
      if (equipment === "prepared") {
        player.stash = catalog
          .filter(
            (item) =>
              item.levelRequirement <= level &&
              item.tags?.some((tag) => relevantTags.has(tag)),
          )
          .map((item) =>
            equipmentToPlayerItem(
              item,
              item.consumable ? template.depth : 1,
            ),
          );
      }
      const context = PlayerContextService.fromPlayer(player);
      const offer = JobOfferBuilder.buildOffers(
        context,
        `${template.id}-${level}-board`,
        [template],
        engine,
      )[0]!;
      const nodes = new SkeletonBuilder({
        context,
        depth: template.depth,
        engine,
        missionId: `${template.id}-${level}-mission`,
        offer,
        seed: `${template.id}-${level}-seed`,
        template,
      }).build();

      expect(Object.keys(nodes)).toHaveLength(2 ** (template.depth + 1) - 1);
      const paths = completePaths(nodes);
      expect(paths).toHaveLength(2 ** template.depth);
      const reservations = SkeletonBuilder.reservationsForSubtree(nodes);
      for (const [itemId, quantity] of Object.entries(reservations)) {
        expect(quantity).toBeLessThanOrEqual(
          player.stash.find((item) => item.id === itemId)?.quantity ?? 0,
        );
      }

      for (const path of paths) {
        expect(path).toHaveLength(template.depth);
        let momentum = 0;
        let livePlayer = structuredClone(player);

        for (const [index, { edge, node }] of path.entries()) {
          const breakdown = edge.checkBreakdown!;
          const expectedUnclamped =
            breakdown.baseChance +
            breakdown.skillChance +
            breakdown.equipmentSkillBonus +
            breakdown.difficultyModifier +
            breakdown.characterPowerBonus +
            breakdown.equipmentPowerBonus +
            breakdown.consumablePowerBonus +
            breakdown.approachBonus -
            breakdown.heatPenalty -
            breakdown.intoxicationPenalty;
          const expectedRisk = template.healthRisk.approaches.includes(
            edge.approach,
          );
          const expectedDamage =
            expectedRisk && !edge.roll.passed
              ? HealthService.damageForFailure(
                  edge.check.difficulty,
                  context.armor,
                )
              : null;
          const expectedRoll = MomentumService.resolveCheck(
            edge.roll.value,
            breakdown.finalChance,
          );
          const expectedDelta = MomentumService.momentumDelta(
            expectedRoll,
            engine,
          );

          expect(edge.check.skill).toBe(APPROACH_SKILLS[edge.approach]);
          expect(breakdown.unclampedChance).toBeCloseTo(expectedUnclamped);
          expect(
            breakdown.unclampedChance + breakdown.finalAdjustment,
          ).toBeCloseTo(breakdown.finalChance);
          expect(breakdown.finalChance).toBe(edge.roll.passChance);
          expect(edge.roll).toEqual(expectedRoll);
          expect(edge.momentumDelta).toBe(expectedDelta);
          expect(edge.healthRisk).toBe(expectedRisk);
          expect(edge.damage).toEqual(expectedDamage);
          if (edge.gear) {
            expect(edge.gear.satisfied).toBe(equipment === "prepared");
            expect(edge.gear.item === null).toBe(equipment === "unprepared");
            expect(breakdown.consumablePower).toBe(
              edge.gear.satisfied && edge.gear.consumes
                ? (edge.gear.item?.power ?? 0)
                : 0,
            );
          }

          const afterGear = consumeMissionGear(
            livePlayer,
            edge,
            "2026-07-10T12:01:00.000Z",
          );
          expect(afterGear.consumed).toBe(
            Boolean(edge.gear?.satisfied && edge.gear.consumes),
          );
          const appliedDamage = HealthService.damageAtCurrentHealth(
            edge.damage,
            afterGear.player.resources.health,
          );
          livePlayer = HealthService.applyDamage(
            afterGear.player,
            appliedDamage,
            "2026-07-10T12:01:00.000Z",
          );
          expect(livePlayer.resources.health).toBeGreaterThanOrEqual(1);
          expect(livePlayer.resources.health).toBeLessThanOrEqual(100);

          momentum += expectedDelta;
          expect(node.id).toBe(edge.id);
          expect(node.depth).toBe(index + 1);
          expect(node.momentum).toBe(momentum);

          if (index === template.depth - 1) {
            expect(node.kind).toBe("outcome");
            expect(node.choices).toBeNull();
            expect(node.outcomeTier).toBe(
              MomentumService.tierForMomentum(
                momentum,
                template.depth,
                engine,
              ),
            );
          } else {
            expect(node.kind).toBe("beat");
            expect(node.choices).toHaveLength(2);
            expect(node.outcomeTier).toBeNull();
          }
        }
      }
    },
  );
});
