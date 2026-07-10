import { EngineConfig } from "../../../shared/engineConfig";
import {
  APPROACH_SKILLS,
  EdgeGear,
  JOB_APPROACHES,
  JobApproach,
  JobOffer,
  MissionNode,
} from "../../../shared/job";
import {
  GearRequirement,
  MissionTemplate,
} from "../../../shared/missionTemplate";
import { clamp } from "./math";
import { HealthService } from "./HealthService";
import { MissionRng } from "./MissionRng";
import { MomentumService } from "./MomentumService";
import {
  EngineGearItem,
  EnginePlayerContext,
} from "./PlayerContextService";

/**
 * Node ids are binary path strings ("0", "01", "110"...) except the root,
 * which is "root" because Firestore field paths cannot be empty strings.
 */
export const ROOT_NODE_ID = "root";

export type SkeletonInput = {
  context: EnginePlayerContext;
  depth: number;
  engine: EngineConfig;
  missionId: string;
  offer: JobOffer;
  seed: string;
  template: MissionTemplate;
};

/** How many units of each exact item a root→node path has spent. */
type ConsumedByItem = Record<string, number>;

/**
 * Builds the complete mission tree: every edge's check is pre-rolled and
 * every leaf's outcome tier is known before the LLM writes a word. The
 * first choice on each beat is the safer one, the second the bolder one.
 *
 * Gear works here too: template gear requirements attach to matching
 * edges, and whether the player owned the gear at accept time decides if
 * the check is eased (equipped professional) or hardened (improvising).
 * Consumables are counted along each path, so one grenade can only
 * satisfy one demand per run.
 */
export class SkeletonBuilder {
  private readonly rng: MissionRng;
  private readonly heatPressure: number;
  private readonly nodes: Record<string, MissionNode> = {};

  constructor(private readonly input: SkeletonInput) {
    this.rng = new MissionRng(input.seed, input.missionId);
    this.heatPressure = Math.floor(
      input.context.heat / input.engine.checks.heatPressureDivisor,
    );
  }

  static childNodeId(parentId: string, index: number): string {
    return parentId === ROOT_NODE_ID ? String(index) : `${parentId}${index}`;
  }

  static parentNodeId(id: string): string | null {
    if (id === ROOT_NODE_ID) return null;
    return id.length === 1 ? ROOT_NODE_ID : id.slice(0, -1);
  }

  /** Maximum exact item quantities needed on any path below a node. */
  static reservationsForSubtree(
    nodes: Record<string, MissionNode>,
    nodeId = ROOT_NODE_ID,
  ): Record<string, number> {
    const node = nodes[nodeId];
    if (!node?.choices) {
      return {};
    }

    const branches = node.choices.map((edge) => {
      const reserved = this.reservationsForSubtree(nodes, edge.id);
      const item = edge.gear?.item;
      if (edge.gear?.satisfied && item) {
        reserved[item.id] = edge.gear.consumes
          ? (reserved[item.id] ?? 0) + 1
          : 1;
      }
      return reserved;
    });
    const ids = new Set(branches.flatMap((branch) => Object.keys(branch)));

    return Object.fromEntries(
      [...ids].map((id) => [
        id,
        Math.max(...branches.map((branch) => branch[id] ?? 0)),
      ]),
    );
  }

  build(): Record<string, MissionNode> {
    this.buildNode(ROOT_NODE_ID, 0, 0, {});
    return this.nodes;
  }

  private buildNode(
    id: string,
    depth: number,
    momentum: number,
    consumed: ConsumedByItem,
  ): void {
    if (depth === this.input.depth) {
      this.nodes[id] = {
        choices: null,
        depth,
        id,
        kind: "outcome",
        momentum,
        narrative: null,
        narrativeStatus: "pending",
        outcomeTier: MomentumService.tierForMomentum(
          momentum,
          this.input.depth,
          this.input.engine,
        ),
      };
      return;
    }

    const approaches = this.rng.pickDistinct(
      JOB_APPROACHES,
      2,
      `${id}:approaches`,
    );

    const node: MissionNode = {
      choices: [],
      depth,
      id,
      kind: "beat",
      momentum,
      narrative: null,
      narrativeStatus: "pending",
      outcomeTier: null,
    };
    this.nodes[id] = node;

    approaches.forEach((approach, index) => {
      const { engine } = this.input;
      const edgeId = SkeletonBuilder.childNodeId(id, index);
      const variance =
        index === 0
          ? -engine.checks.saferBolderGap
          : engine.checks.saferBolderGap;

      const gear = this.rollGear(edgeId, approach, consumed);
      const gearModifier = gear
        ? gear.satisfied
          ? -engine.gear.satisfiedBonus
          : engine.gear.missingPenalty
        : 0;

      const checkDifficulty = clamp(
        this.input.offer.difficulty +
          this.heatPressure +
          depth * engine.checks.perBeatDepth +
          variance +
          gearModifier,
        1,
        100,
      );
      const skill = APPROACH_SKILLS[approach];
      const consumablePower =
        gear?.satisfied && gear.consumes ? (gear.item?.power ?? 0) : 0;
      const checkBreakdown = MomentumService.checkBreakdown(
        this.input.context,
        skill,
        approach,
        checkDifficulty,
        engine,
        consumablePower,
      );
      const roll = MomentumService.resolveCheck(
        this.rng.rollD100(`edge:${edgeId}`),
        checkBreakdown.finalChance,
      );
      const delta = MomentumService.momentumDelta(roll, engine);
      const healthRisk =
        this.input.template.healthRisk?.approaches.includes(approach) ?? false;
      const damage =
        healthRisk && !roll.passed
          ? HealthService.damageForFailure(
              checkDifficulty,
              this.input.context.armor,
            )
          : null;

      node.choices!.push({
        approach,
        check: { difficulty: checkDifficulty, skill },
        checkBreakdown,
        damage,
        gear,
        healthRisk,
        id: edgeId,
        intent: null,
        label: null,
        momentumDelta: delta,
        riskHint: null,
        roll,
      });

      this.buildNode(
        edgeId,
        depth + 1,
        momentum + delta,
        this.consumeAlongPath(gear, consumed),
      );
    });
  }

  /**
   * Decides whether this edge demands gear (first matching template entry
   * whose chance roll fires) and whether the player can satisfy it given
   * what this path has already burned through.
   */
  private rollGear(
    edgeId: string,
    approach: JobApproach,
    consumed: ConsumedByItem,
  ): EdgeGear | null {
    const requirements = this.input.template.gear ?? [];

    for (let i = 0; i < requirements.length; i += 1) {
      const requirement = requirements[i]!;
      if (!requirement.approaches.includes(approach)) continue;

      const roll = this.rng.rollD100(`gear:${edgeId}:${i}`);
      if (roll > requirement.chance * 100) continue;

      const item = this.selectItem(requirement, consumed);
      return {
        consumes: item?.consumable ?? requirement.consumes,
        label: requirement.label,
        item: item
          ? {
              consumable: item.consumable,
              id: item.id,
              name: item.name,
              power: item.power,
            }
          : null,
        satisfied: item !== null,
        tags: requirement.tags,
      };
    }

    return null;
  }

  private selectItem(
    requirement: GearRequirement,
    consumed: ConsumedByItem,
  ): EngineGearItem | null {
    return (
      this.input.context.gearItems.find(
        (item) =>
          item.tags.some((tag) => requirement.tags.includes(tag)) &&
          (!item.consumable ||
            item.quantity - (consumed[item.id] ?? 0) > 0),
      ) ?? null
    );
  }

  /** Books one consumable against the path when a satisfied edge spends it. */
  private consumeAlongPath(
    gear: EdgeGear | null,
    consumed: ConsumedByItem,
  ): ConsumedByItem {
    if (!gear || !gear.satisfied || !gear.consumes) {
      return consumed;
    }
    const itemId = gear.item?.id;
    return itemId
      ? { ...consumed, [itemId]: (consumed[itemId] ?? 0) + 1 }
      : consumed;
  }
}
