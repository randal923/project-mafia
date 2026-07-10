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
import { MissionRng } from "./MissionRng";
import { MomentumService } from "./MomentumService";
import { EnginePlayerContext } from "./PlayerContextService";

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

/** How many of each tag's consumables a root→node path has spent. */
type ConsumedByTag = Record<string, number>;

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

  build(): Record<string, MissionNode> {
    this.buildNode(ROOT_NODE_ID, 0, 0, {});
    return this.nodes;
  }

  private buildNode(
    id: string,
    depth: number,
    momentum: number,
    consumed: ConsumedByTag,
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
      const chance = MomentumService.passChance(
        this.input.context,
        skill,
        approach,
        checkDifficulty,
        engine,
      );
      const roll = MomentumService.resolveCheck(
        this.rng.rollD100(`edge:${edgeId}`),
        chance,
      );
      const delta = MomentumService.momentumDelta(roll, engine);

      node.choices!.push({
        approach,
        check: { difficulty: checkDifficulty, skill },
        gear,
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
    consumed: ConsumedByTag,
  ): EdgeGear | null {
    const requirements = this.input.template.gear ?? [];

    for (let i = 0; i < requirements.length; i += 1) {
      const requirement = requirements[i]!;
      if (!requirement.approaches.includes(approach)) continue;

      const roll = this.rng.rollD100(`gear:${edgeId}:${i}`);
      if (roll > requirement.chance * 100) continue;

      return {
        consumes: requirement.consumes,
        label: requirement.label,
        satisfied: this.isSatisfied(requirement, consumed),
        tags: requirement.tags,
      };
    }

    return null;
  }

  private isSatisfied(
    requirement: GearRequirement,
    consumed: ConsumedByTag,
  ): boolean {
    return requirement.tags.some((tag) => {
      const owned = this.input.context.gearTags[tag];
      if (!owned) return false;
      if (owned.permanent) return true;
      return owned.consumables - (consumed[tag] ?? 0) > 0;
    });
  }

  /** Books one consumable against the path when a satisfied edge spends it. */
  private consumeAlongPath(
    gear: EdgeGear | null,
    consumed: ConsumedByTag,
  ): ConsumedByTag {
    if (!gear || !gear.satisfied || !gear.consumes) {
      return consumed;
    }

    // A non-consumable item (a crowbar, an equipped piece) covers the
    // demand for free; only reach for consumable stock without one.
    const hasPermanent = gear.tags.some(
      (tag) => this.input.context.gearTags[tag]?.permanent,
    );
    if (hasPermanent) {
      return consumed;
    }

    for (const tag of gear.tags) {
      const owned = this.input.context.gearTags[tag];
      if (owned && owned.consumables - (consumed[tag] ?? 0) > 0) {
        return { ...consumed, [tag]: (consumed[tag] ?? 0) + 1 };
      }
    }

    return consumed;
  }
}
