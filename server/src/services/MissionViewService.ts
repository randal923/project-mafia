import {
  Mission,
  MissionView,
  MissionViewChoice,
  MissionViewStep,
  RevealedEdge,
} from "../../../shared/job";
import { SkillExperienceService } from "../engine/SkillExperienceService";
import { ROOT_NODE_ID } from "../engine/SkeletonBuilder";

/**
 * Redacts a mission for the client: only visited nodes appear, past edges
 * reveal their check results, and future rolls never leave the server.
 */
export class MissionViewService {
  static toView(mission: Mission): MissionView {
    const visitedIds = [ROOT_NODE_ID, ...mission.choicePath];
    const steps: MissionViewStep[] = visitedIds.map((nodeId, index) => {
      const node = mission.nodes[nodeId];
      if (!node) {
        throw new Error(`Mission ${mission.id} is missing node ${nodeId}`);
      }

      return {
        edgeTaken:
          index === 0
            ? null
            : this.revealEdge(mission, visitedIds[index - 1]!, nodeId),
        kind: node.kind,
        narrative: node.narrative,
        narrativeStatus: node.narrativeStatus,
        nodeId,
        outcomeTier: node.kind === "outcome" ? node.outcomeTier : null,
      };
    });

    const current = mission.nodes[mission.currentNodeId];
    const skillExperienceSettings = mission.template?.skillExperience;
    const choices: MissionViewChoice[] | null =
      current?.kind === "beat" && current.choices
        ? current.choices.map((edge) => ({
            approach: edge.approach,
            check: edge.check,
            ...(edge.checkBreakdown && {
              checkBreakdown: edge.checkBreakdown,
            }),
            gear: edge.gear ?? null,
            healthRisk: edge.healthRisk ?? false,
            id: edge.id,
            intent: edge.intent,
            label: edge.label,
            odds: {
              failure: 100 - edge.roll.passChance,
              success: edge.roll.passChance,
            },
            riskHint: edge.riskHint,
            skillExperience: skillExperienceSettings
              ? SkillExperienceService.previewForCheck(
                  edge.check,
                  skillExperienceSettings,
                )
              : null,
          }))
        : null;

    const nodes = Object.values(mission.nodes);

    return {
      ...(mission.acceptedState && { acceptedState: mission.acceptedState }),
      choices,
      createdAt: mission.createdAt,
      depth: mission.depth,
      id: mission.id,
      narrativeProgress: {
        ready: nodes.filter((n) => n.narrativeStatus !== "pending").length,
        total: nodes.length,
      },
      offer: mission.offer,
      resolution: mission.resolution,
      status: mission.status,
      steps,
      updatedAt: mission.updatedAt,
    };
  }

  private static revealEdge(
    mission: Mission,
    parentId: string,
    nodeId: string,
  ): RevealedEdge {
    const edge = mission.nodes[parentId]?.choices?.find((c) => c.id === nodeId);
    if (!edge) {
      throw new Error(`Mission ${mission.id} has no edge ${parentId}→${nodeId}`);
    }

    return {
      approach: edge.approach,
      check: edge.check,
      ...(edge.checkBreakdown && { checkBreakdown: edge.checkBreakdown }),
      damage: edge.damage ?? null,
      gear: edge.gear ?? null,
      id: edge.id,
      label: edge.label,
      margin: edge.roll.margin,
      passed: edge.roll.passed,
    };
  }
}
