import { randomBytes, randomUUID } from "node:crypto";
import {
  CollectionReference,
  DocumentReference,
  FieldPath,
  Firestore,
} from "firebase-admin/firestore";
import {
  ChoiceEdge,
  JobBoard,
  Mission,
  MissionNode,
} from "../../../shared/job";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { NarrativeEvent, appendStorySummary } from "../../../shared/narrative";
import { Player, normalizePlayer } from "../../../shared/player";
import { JobCalculatorService } from "../engine/JobCalculatorService";
import { HealthService } from "../engine/HealthService";
import { PlayerContextService } from "../engine/PlayerContextService";
import { RewardService } from "../engine/RewardService";
import { SkillExperienceService } from "../engine/SkillExperienceService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../engine/SkeletonBuilder";
import { consumeMissionGear } from "../engine/consumeMissionGear";
import { HttpError } from "../middleware/errorHandler";
import { MissionNarrator } from "./ai/MissionNarrator";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";
import { JobBoardService } from "./JobBoardService";
import { MissionTemplateService } from "./MissionTemplateService";
import { PrisonService } from "./PrisonService";

/** A generation older than this with pending nodes is considered crashed. */
const STALE_GENERATION_MS = 60_000;

export const MISSION_PROMPT_VERSION = "mission-node-v1";

export class MissionService {
  private readonly db: Firestore;
  /** Missions this process is currently narrating (concurrency guard). */
  private readonly narrating = new Set<string>();

  constructor(
    firebase: FirebaseService,
    private readonly board: JobBoardService,
    private readonly narrator: MissionNarrator,
    private readonly templates: MissionTemplateService,
    private readonly engine: EngineConfigService,
    private readonly prison: PrisonService,
  ) {
    this.db = firebase.firestore;
  }

  async acceptJob(player: Player, offerId: string): Promise<Mission> {
    const missionId = randomUUID();
    const seed = randomBytes(16).toString("hex");
    const nowIso = new Date().toISOString();
    const boardRef = this.board.boardRef(player.id);
    const missionRef = this.missions(player.id).doc(missionId);
    const playerRef = this.db.collection("players").doc(player.id);
    const activeQuery = this.activeMissionQuery(player.id);

    const mission = await this.db.runTransaction(async (tx) => {
      const [boardSnap, activeSnap, playerSnap] = await Promise.all([
        tx.get(boardRef),
        tx.get(activeQuery),
        tx.get(playerRef),
      ]);

      if (!activeSnap.empty) {
        throw new HttpError(409, "You already have a job in progress.");
      }
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const current = normalizePlayer(playerSnap.data() as Player);
      if (current.prison) {
        throw new HttpError(403, "You're in prison. Jobs can wait.");
      }

      const boardData = boardSnap.exists ? (boardSnap.data() as JobBoard) : null;
      const offer = boardData?.offers.find((o) => o.id === offerId);
      if (!boardData || !offer) {
        throw new HttpError(404, "That job is no longer on the board.");
      }

      const template =
        this.templates.find(offer.templateId) ?? this.templates.first();

      // Every job costs energy; drugs or idle time buy it back.
      const staminaCost = JobCalculatorService.staminaCost(
        template,
        offer.difficulty,
        this.engine.config,
      );
      if (current.resources.stamina < staminaCost) {
        throw new HttpError(
          400,
          "You're running on empty. Rest up or find something at the store.",
        );
      }

      const context = PlayerContextService.fromPlayer(current);
      const nodes = new SkeletonBuilder({
        context,
        depth: template.depth,
        engine: this.engine.config,
        missionId,
        offer,
        seed,
        template,
      }).build();

      const created: Mission = {
        acceptedState: PlayerContextService.acceptedState(current, template),
        choicePath: [],
        createdAt: nowIso,
        currentNodeId: ROOT_NODE_ID,
        depth: template.depth,
        generationStartedAt: null,
        id: missionId,
        nodes,
        offer,
        promptVersion: MISSION_PROMPT_VERSION,
        resolution: null,
        seed,
        status: "generating",
        template,
        uid: player.id,
        updatedAt: nowIso,
      };

      tx.set(boardRef, {
        ...boardData,
        offers: boardData.offers.filter((o) => o.id !== offerId),
      });
      tx.set(playerRef, {
        ...current,
        reservedEquipment: {
          items: SkeletonBuilder.reservationsForSubtree(nodes),
          missionId,
        },
        resources: {
          ...current.resources,
          stamina: current.resources.stamina - staminaCost,
        },
        updatedAt: nowIso,
      });
      tx.create(missionRef, created);
      return created;
    });

    this.startNarration(mission, player);
    return mission;
  }

  async getActiveMission(player: Player): Promise<Mission | null> {
    const snapshot = await this.activeMissionQuery(player.id).get();
    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    const mission = doc.data() as Mission;
    this.repairStaleNarration(mission, player);
    return mission;
  }

  async getMission(player: Player, missionId: string): Promise<Mission> {
    const snapshot = await this.missions(player.id).doc(missionId).get();
    if (!snapshot.exists) {
      throw new HttpError(404, "Mission not found.");
    }

    const mission = snapshot.data() as Mission;
    this.repairStaleNarration(mission, player);
    return mission;
  }

  async hasActiveMission(uid: string): Promise<boolean> {
    const snapshot = await this.activeMissionQuery(uid).get();
    return !snapshot.empty;
  }

  async choose(
    player: Player,
    missionId: string,
    choiceId: string,
  ): Promise<{ mission: Mission; player: Player }> {
    const nowIso = new Date().toISOString();
    const missionRef = this.missions(player.id).doc(missionId);
    const playerRef = this.db.collection("players").doc(player.id);
    const eventId = randomUUID();

    const result = await this.db.runTransaction(async (tx) => {
      const [missionSnap, playerSnap] = await Promise.all([
        tx.get(missionRef),
        tx.get(playerRef),
      ]);

      if (!missionSnap.exists) {
        throw new HttpError(404, "Mission not found.");
      }
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const mission = missionSnap.data() as Mission;
      if (mission.status === "resolved") {
        throw new HttpError(409, "This job is already over.");
      }

      const current = mission.nodes[mission.currentNodeId];
      const edge = current?.choices?.find((c) => c.id === choiceId);
      if (!current || current.kind !== "beat" || !edge) {
        throw new HttpError(400, "That is not one of your options.");
      }

      const target = mission.nodes[edge.id];
      if (!target) {
        throw new HttpError(500, "Mission tree is corrupted.");
      }
      if (target.narrativeStatus === "pending") {
        throw new HttpError(409, "still_generating");
      }

      mission.choicePath = [...mission.choicePath, edge.id];
      mission.currentNodeId = edge.id;
      mission.updatedAt = nowIso;

      // Taking the edge reveals its pre-rolled check; a pass teaches the
      // skill that was tested (100 XP = a skill level). Numbers come from
      // the mission template.
      const template = this.templateOf(mission);
      const skillGain = SkillExperienceService.applyToPlayer(
        normalizePlayer(playerSnap.data() as Player),
        edge,
        template.skillExperience,
        this.engine.config,
        nowIso,
      );

      // Gear the edge relied on gets spent — the flashbang goes off.
      const afterGear = consumeMissionGear(skillGain.player, edge, nowIso);
      if (
        edge.gear?.satisfied &&
        edge.gear.consumes &&
        edge.gear.item &&
        !afterGear.consumed
      ) {
        throw new HttpError(
          409,
          `${edge.gear.item.name} is no longer available for this choice.`,
        );
      }
      edge.damage = HealthService.damageAtCurrentHealth(
        edge.damage,
        afterGear.player.resources.health,
      );
      const afterDamage = HealthService.applyDamage(
        afterGear.player,
        edge.damage,
        nowIso,
      );
      let updatedPlayer: Player = {
        ...afterDamage,
        reservedEquipment: {
          items: SkeletonBuilder.reservationsForSubtree(
            mission.nodes,
            target.id,
          ),
          missionId: mission.id,
        },
        updatedAt: nowIso,
      };

      if (target.kind === "outcome") {
        updatedPlayer = this.resolve(
          tx,
          mission,
          template,
          target,
          updatedPlayer,
          playerRef,
          eventId,
          nowIso,
        );
      } else {
        tx.set(playerRef, updatedPlayer);
      }

      tx.set(missionRef, mission);
      return { mission, player: updatedPlayer };
    });

    return result;
  }

  /** Applies rewards and emits the world-story event. Transactional. */
  private resolve(
    tx: FirebaseFirestore.Transaction,
    mission: Mission,
    template: MissionTemplate,
    outcome: MissionNode,
    player: Player,
    playerRef: DocumentReference,
    eventId: string,
    nowIso: string,
  ): Player {
    const tier = outcome.outcomeTier ?? "partial_failure";
    const rewards = RewardService.mitigateHeat(
      RewardService.rewardsForTier(tier, mission.offer, template),
      mission.acceptedState?.loadout ?? player.loadout,
    );
    const summary =
      outcome.narrative?.storySummary ??
      `The ${mission.offer.storySeed.location} job ended in ${tier.replace(/_/g, " ")}.`;

    const applied = RewardService.applyToPlayer(player, rewards, nowIso);
    const updatedPlayer: Player = {
      ...applied.player,
      narrative: {
        ...applied.player.narrative,
        storySummary: appendStorySummary(
          applied.player.narrative.storySummary,
          summary,
        ),
      },
      // A disaster means the police got you — off to the county lockup.
      ...(tier === "disaster" && {
        prison: this.prison.sentence(
          `Arrested after the ${mission.offer.storySeed.location} job.`,
          nowIso,
        ),
      }),
      reservedEquipment: null,
    };

    const event: NarrativeEvent = {
      cashChange: rewards.cashChange,
      createdAt: nowIso,
      district: mission.offer.district,
      heatChange: rewards.heatChange,
      id: eventId,
      missionId: mission.id,
      outcomeTier: tier,
      summary,
      title: outcome.narrative?.title ?? "A job on the Docks",
      type: "job_resolved",
    };

    mission.resolution = {
      cashChange: rewards.cashChange,
      heatChange: rewards.heatChange,
      levelsGained: applied.levelsGained,
      narrativeEventId: eventId,
      skillExperienceGained: SkillExperienceService.summarize(
        this.selectedEdges(mission),
        template.skillExperience,
        this.engine.config,
      ),
      tier,
      xpChange: rewards.xpChange,
    };
    mission.status = "resolved";

    tx.set(playerRef, updatedPlayer);
    tx.create(
      playerRef.collection("narrativeEvents").doc(eventId),
      event,
    );

    return updatedPlayer;
  }

  /**
   * Fire-and-forget narration. Fills pending nodes level by level so the
   * intro is readable while deeper levels are still being written.
   */
  private startNarration(mission: Mission, player: Player): void {
    if (this.narrating.has(mission.id)) {
      return;
    }

    this.narrating.add(mission.id);
    this.runNarration(mission, player)
      .catch((err) => {
        console.error(`Narration failed for mission ${mission.id}:`, err);
      })
      .finally(() => {
        this.narrating.delete(mission.id);
      });
  }

  /** Re-kicks a narration pipeline that died mid-run (process crash). */
  private repairStaleNarration(mission: Mission, player: Player): void {
    const hasPending = Object.values(mission.nodes).some(
      (n) => n.narrativeStatus === "pending",
    );
    if (!hasPending || this.narrating.has(mission.id)) {
      return;
    }

    const startedAt = mission.generationStartedAt
      ? Date.parse(mission.generationStartedAt)
      : 0;
    if (Date.now() - startedAt > STALE_GENERATION_MS) {
      this.startNarration(mission, player);
    }
  }

  private async runNarration(mission: Mission, player: Player): Promise<void> {
    const missionRef = this.missions(mission.uid).doc(mission.id);
    await missionRef.update({
      generationStartedAt: new Date().toISOString(),
    });

    for (let depth = 0; depth <= mission.depth; depth += 1) {
      const level = Object.values(mission.nodes).filter(
        (node) => node.depth === depth && node.narrativeStatus === "pending",
      );

      await Promise.all(
        level.map((node) => this.narrateNode(mission, player, node, missionRef)),
      );
    }

    // Only flip generating → active; never clobber a mid-generation resolve.
    await this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(missionRef);
      if (!snapshot.exists) return;
      const stored = snapshot.data() as Mission;
      if (stored.status === "generating") {
        tx.update(missionRef, {
          status: "active",
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  private async narrateNode(
    mission: Mission,
    player: Player,
    node: MissionNode,
    missionRef: DocumentReference,
  ): Promise<void> {
    const input = {
      ancestors: this.ancestorsOf(mission, node.id),
      edgeTaken: this.edgeInto(mission, node.id),
      mission,
      node,
      player,
    };

    if (node.kind === "outcome") {
      const tier = node.outcomeTier ?? "partial_failure";
      const result = await this.narrator.narrateOutcome({
        ...input,
        rewards: RewardService.mitigateHeat(
          RewardService.rewardsForTier(
            tier,
            mission.offer,
            this.templateOf(mission),
          ),
          mission.acceptedState?.loadout ?? player.loadout,
        ),
      });
      node.narrative = result.narrative;
      node.narrativeStatus = "ready";
    } else {
      const result = await this.narrator.narrateBeat(input);
      node.narrative = result.narrative;
      node.narrativeStatus = "ready";
      node.choices?.forEach((edge, index) => {
        const text = result.choices[index];
        if (text) {
          edge.intent = text.intent;
          edge.label = text.label;
          edge.riskHint = text.riskHint;
        }
      });
    }

    // Node ids like "01" start with a digit, so use an explicit FieldPath.
    await missionRef.update(new FieldPath("nodes", node.id), node);
  }

  /** Snapshot on the mission doc; falls back for pre-template missions. */
  private templateOf(mission: Mission): MissionTemplate {
    return (
      mission.template ??
      this.templates.find(mission.offer.templateId ?? "") ??
      this.templates.first()
    );
  }

  private ancestorsOf(mission: Mission, nodeId: string): MissionNode[] {
    const ancestors: MissionNode[] = [];
    let parentId = SkeletonBuilder.parentNodeId(nodeId);

    while (parentId !== null) {
      const parent = mission.nodes[parentId];
      if (parent) {
        ancestors.unshift(parent);
      }
      parentId = SkeletonBuilder.parentNodeId(parentId);
    }

    return ancestors;
  }

  private edgeInto(mission: Mission, nodeId: string): ChoiceEdge | null {
    const parentId = SkeletonBuilder.parentNodeId(nodeId);
    if (parentId === null) {
      return null;
    }
    return (
      mission.nodes[parentId]?.choices?.find((c) => c.id === nodeId) ?? null
    );
  }

  private selectedEdges(mission: Mission): ChoiceEdge[] {
    const edges: ChoiceEdge[] = [];
    let parentId = ROOT_NODE_ID;

    for (const nodeId of mission.choicePath) {
      const edge = mission.nodes[parentId]?.choices?.find(
        (choice) => choice.id === nodeId,
      );
      if (!edge) {
        throw new Error(
          `Mission ${mission.id} has no selected edge ${parentId}→${nodeId}`,
        );
      }

      edges.push(edge);
      parentId = nodeId;
    }

    return edges;
  }

  private activeMissionQuery(uid: string) {
    return this.missions(uid)
      .where("status", "in", ["generating", "active"])
      .limit(1);
  }

  private missions(uid: string): CollectionReference {
    return this.db.collection("players").doc(uid).collection("missions");
  }
}
