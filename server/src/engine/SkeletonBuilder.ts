import { EngineConfig } from "../../../shared/engineConfig";
import {
  APPROACH_SKILLS,
  EdgeGear,
  EdgeStakes,
  JOB_APPROACHES,
  JobApproach,
  JobOffer,
  MissionNode,
} from "../../../shared/job";
import {
  GearRequirement,
  MissionTemplate,
} from "../../../shared/missionTemplate";
import { clamp, roundToFive } from "./math";
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

type SkeletonPlan = {
  approachesByNode: Record<string, JobApproach[]>;
  guaranteedGearByEdge: Record<string, GearRequirement>;
};

/**
 * Builds the complete mission tree: every edge's check is pre-rolled and
 * every leaf's outcome tier is known before the LLM writes a word. The
 * first choice on each beat is the safer one, the second the bolder one.
 *
 * Gear works here too: template gear requirements attach to matching
 * edges. Owning the gear at accept time eases the check; NOT owning it
 * locks the edge (at most one per beat, so a path always stays open).
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
    const plan = this.planSkeleton();
    this.buildNode(ROOT_NODE_ID, 0, 0, {}, plan);
    return this.nodes;
  }

  private buildNode(
    id: string,
    depth: number,
    momentum: number,
    consumed: ConsumedByItem,
    plan: SkeletonPlan,
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

    const approaches = plan.approachesByNode[id];
    if (!approaches) {
      throw new Error(`Mission skeleton plan is missing beat node ${id}.`);
    }

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

    // Missing gear locks its edge, so a beat must always keep one path
    // open: when both edges land unsatisfiable demands, the demand that
    // wasn't reserved by the template plan is waived.
    const gearByIndex = approaches.map((approach, index) => {
      const edgeId = SkeletonBuilder.childNodeId(id, index);
      return this.rollGear(
        edgeId,
        approach,
        consumed,
        plan.guaranteedGearByEdge[edgeId],
      );
    });
    if (gearByIndex.every((gear) => gear && !gear.satisfied)) {
      const guaranteedIndex = approaches.findIndex(
        (_, index) =>
          plan.guaranteedGearByEdge[SkeletonBuilder.childNodeId(id, index)],
      );
      gearByIndex[guaranteedIndex === 1 ? 0 : 1] = null;
    }

    approaches.forEach((approach, index) => {
      const { engine } = this.input;
      const edgeId = SkeletonBuilder.childNodeId(id, index);
      const stakes: EdgeStakes = index === 0 ? "safer" : "bolder";
      const variance =
        index === 0
          ? -engine.checks.saferBolderGap
          : engine.checks.saferBolderGap;

      const gear = gearByIndex[index] ?? null;
      const gearModifier = gear?.satisfied ? -engine.gear.satisfiedBonus : 0;

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
      const delta = MomentumService.momentumDelta(roll, stakes, engine);
      const healthRisk =
        this.input.template.healthRisk?.approaches.includes(approach) ?? false;
      const damage =
        healthRisk && !roll.passed
          ? HealthService.damageForFailure(
              checkDifficulty,
              this.input.context.armor,
            )
          : null;
      const costs = engine.approaches[approach];

      node.choices!.push({
        approach,
        cashCost: roundToFive(
          (costs.cashCostFactor ?? 0) * this.input.offer.rewardMax,
        ),
        check: { difficulty: checkDifficulty, skill },
        checkBreakdown,
        damage,
        gear,
        healthRisk,
        heatOnFail: costs.heatOnFail ?? 0,
        id: edgeId,
        intent: null,
        label: null,
        momentumDelta: delta,
        momentumPreview: {
          fail: engine.momentum[stakes].fail,
          pass: engine.momentum[stakes].pass,
        },
        riskHint: null,
        roll,
        stakes,
      });

      this.buildNode(
        edgeId,
        depth + 1,
        momentum + delta,
        this.consumeAlongPath(gear, consumed),
        plan,
      );
    });
  }

  /**
   * Selects every beat's approaches and reserves one distinct beat for each
   * advertised gear requirement before any dependent check math is built.
   */
  private planSkeleton(): SkeletonPlan {
    const beatNodeIds = this.beatNodeIds();
    const requirements = this.input.template.gear ?? [];
    if (requirements.length > beatNodeIds.length) {
      throw new Error(
        `Mission ${this.input.template.id} has more gear requirements than beat nodes.`,
      );
    }

    const approachesByNode = Object.fromEntries(
      beatNodeIds.map((nodeId) => [
        nodeId,
        this.rng.pickDistinct(JOB_APPROACHES, 2, `${nodeId}:approaches`),
      ]),
    );
    const guaranteedGearByEdge: Record<string, GearRequirement> = {};
    const availableNodes = new Set(beatNodeIds);
    const orderedRequirements = requirements
      .map((requirement, requirementIndex) => ({
        requirement,
        requirementIndex,
      }))
      .sort(
        (a, b) =>
          a.requirement.approaches.length - b.requirement.approaches.length ||
          a.requirementIndex - b.requirementIndex,
      );

    orderedRequirements.forEach(({ requirement, requirementIndex }) => {
      const compatibleNodes = [...availableNodes].filter((nodeId) =>
        approachesByNode[nodeId]!.some((approach) =>
          requirement.approaches.includes(approach),
        ),
      );
      const nodeId = this.rng.pickDistinct(
        compatibleNodes.length > 0 ? compatibleNodes : [...availableNodes],
        1,
        `gear:guaranteed:${requirementIndex}:node`,
      )[0]!;
      availableNodes.delete(nodeId);
      const approaches = approachesByNode[nodeId]!;
      const matchingEdgeIndexes = approaches
        .map((approach, edgeIndex) =>
          requirement.approaches.includes(approach) ? edgeIndex : null,
        )
        .filter((edgeIndex): edgeIndex is number => edgeIndex !== null);
      let edgeIndex = this.rng.pickDistinct(
        matchingEdgeIndexes,
        1,
        `gear:guaranteed:${requirementIndex}:matching-edge`,
      )[0];

      if (edgeIndex === undefined) {
        edgeIndex =
          this.rng.hashValue(`gear:guaranteed:${requirementIndex}:edge`) % 2;
        approaches[edgeIndex] = this.rng.pickDistinct(
          requirement.approaches,
          1,
          `gear:guaranteed:${requirementIndex}:approach`,
        )[0]!;
      }

      const edgeId = SkeletonBuilder.childNodeId(nodeId, edgeIndex);
      guaranteedGearByEdge[edgeId] = requirement;
    });

    return { approachesByNode, guaranteedGearByEdge };
  }

  private beatNodeIds(): string[] {
    const ids = [ROOT_NODE_ID];

    for (let depth = 1; depth < this.input.depth; depth += 1) {
      ids.push(
        ...Array.from({ length: 2 ** depth }, (_, index) =>
          index.toString(2).padStart(depth, "0"),
        ),
      );
    }

    return ids;
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
    guaranteedRequirement?: GearRequirement,
  ): EdgeGear | null {
    if (guaranteedRequirement) {
      return this.gearForRequirement(guaranteedRequirement, consumed);
    }

    const requirements = this.input.template.gear ?? [];

    for (let i = 0; i < requirements.length; i += 1) {
      const requirement = requirements[i]!;
      if (!requirement.approaches.includes(approach)) continue;

      const roll = this.rng.rollD100(`gear:${edgeId}:${i}`);
      if (roll > requirement.chance * 100) continue;

      return this.gearForRequirement(requirement, consumed);
    }

    return null;
  }

  private gearForRequirement(
    requirement: GearRequirement,
    consumed: ConsumedByItem,
  ): EdgeGear {
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
