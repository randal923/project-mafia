import { EngineConfig } from "../../../shared/engineConfig";
import {
  APPROACH_SKILLS,
  JOB_APPROACHES,
  JobOffer,
  MissionNode,
} from "../../../shared/job";
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
};

/**
 * Builds the complete mission tree: every edge's check is pre-rolled and
 * every leaf's outcome tier is known before the LLM writes a word. The
 * first choice on each beat is the safer one, the second the bolder one.
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
    this.buildNode(ROOT_NODE_ID, 0, 0);
    return this.nodes;
  }

  private buildNode(id: string, depth: number, momentum: number): void {
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
      const checkDifficulty = clamp(
        this.input.offer.difficulty +
          this.heatPressure +
          depth * engine.checks.perBeatDepth +
          variance,
        1,
        10,
      );
      const skill = APPROACH_SKILLS[approach];
      const chance = MomentumService.passChance(
        this.input.context.skills[skill],
        checkDifficulty,
        this.input.context.effectivePower,
        this.input.context.heat,
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
        id: edgeId,
        intent: null,
        label: null,
        momentumDelta: delta,
        riskHint: null,
        roll,
      });

      this.buildNode(edgeId, depth + 1, momentum + delta);
    });
  }
}
