import { randomBytes, randomUUID } from "node:crypto";
import {
  CollectionReference,
  DocumentReference,
  FieldPath,
  FieldValue,
  Firestore,
} from "firebase-admin/firestore";
import { RESPECT_WEIGHTS } from "../../../shared/season";
import {
  CREW_ARCHETYPES,
  CREW_INJURY_RECOVERY_HOURS,
  CREW_PRISON_HOURS,
  CrewMember,
  MAX_CREW_LOYALTY,
  crewCheckBonus,
  crewJobCapacity,
  crewTraitModifiers,
  normalizeCrewMember,
} from "../../../shared/crew";
import { DISTRICTS } from "../../../shared/district";
import {
  ChoiceEdge,
  JobBoard,
  JobOffer,
  Mission,
  MissionCrewOutcome,
  MissionCrewSnapshot,
  MissionNode,
} from "../../../shared/job";
import { CAPTURE_SHIELD_HOURS, TurfState } from "../../../shared/territory";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { NarrativeEvent, appendStorySummary } from "../../../shared/narrative";
import { MAX_HEAT, Player, normalizePlayer } from "../../../shared/player";
import { MissionRng } from "../engine/MissionRng";
import { JobCalculatorService } from "../engine/JobCalculatorService";
import { HealthService } from "../engine/HealthService";
import { MomentumService } from "../engine/MomentumService";
import { PlayerContextService } from "../engine/PlayerContextService";
import { RewardService } from "../engine/RewardService";
import { SkillExperienceService } from "../engine/SkillExperienceService";
import { ROOT_NODE_ID, SkeletonBuilder } from "../engine/SkeletonBuilder";
import { consumeMissionGear } from "../engine/consumeMissionGear";
import { HttpError } from "../middleware/errorHandler";
import { MissionNarrator } from "./ai/MissionNarrator";
import { EffectsService } from "./EffectsService";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";
import { JobBoardService } from "./JobBoardService";
import { MissionTemplateService } from "./MissionTemplateService";
import { NotificationService } from "./NotificationService";
import { PrisonService } from "./PrisonService";
import { SeasonService } from "./SeasonService";
import { WorldEventService } from "./WorldEventService";

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
    private readonly notifications: NotificationService,
    private readonly worldEvents: WorldEventService,
    private readonly seasons: SeasonService,
    private readonly effects: EffectsService,
  ) {
    this.db = firebase.firestore;
  }

  /**
   * Accepts a map-generated turf takeover: same engine, same stamina
   * economy, no board involved. The mission carries its claim so ending
   * it well plants the flag inside the resolve transaction.
   */
  async acceptTakeover(
    player: Player,
    offer: JobOffer,
    template: MissionTemplate,
    claim: { seasonId: string; turfId: string; turfName: string },
    crewIds: string[] = [],
  ): Promise<Mission> {
    const missionId = randomUUID();
    const seed = randomBytes(16).toString("hex");
    const nowIso = new Date().toISOString();
    const perks = await this.effects.forPlayer(player.id);
    const missionRef = this.missions(player.id).doc(missionId);
    const playerRef = this.db.collection("players").doc(player.id);
    const turfRef = this.db
      .collection("seasons")
      .doc(claim.seasonId)
      .collection("turfs")
      .doc(claim.turfId);

    const mission = await this.db.runTransaction(async (tx) => {
      const crewRefs = crewIds.map((id) =>
        playerRef.collection("crew").doc(id),
      );
      const [activeSnap, playerSnap, turfSnap, ...crewSnaps] =
        await Promise.all([
          tx.get(this.activeMissionQuery(player.id)),
          tx.get(playerRef),
          tx.get(turfRef),
          ...crewRefs.map((ref) => tx.get(ref)),
        ]);

      if (!activeSnap.empty) {
        throw new HttpError(409, "You already have a job in progress.");
      }
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }
      if (!turfSnap.exists) {
        throw new HttpError(404, "That turf doesn't exist.");
      }
      const turf = turfSnap.data() as TurfState;
      if (turf.ownerUid !== null) {
        throw new HttpError(409, "Someone planted a flag there first.");
      }

      const current = normalizePlayer(playerSnap.data() as Player);
      if (current.prison) {
        throw new HttpError(403, "You're in prison. The map can wait.");
      }

      const capacity = crewJobCapacity(current.progression.skills.leadership);
      if (crewIds.length > capacity) {
        throw new HttpError(
          400,
          `Your leadership carries ${capacity} on a job — no more.`,
        );
      }
      const crewMembers = crewSnaps.map((snap, i) => {
        if (!snap.exists) {
          throw new HttpError(404, `No such crew member: ${crewIds[i]}.`);
        }
        const member = normalizeCrewMember(snap.data() as CrewMember);
        if (member.status !== "idle") {
          throw new HttpError(409, `${member.name} isn't free for a job.`);
        }
        return member;
      });
      const crewSnapshots: MissionCrewSnapshot[] = crewMembers.map(
        (member) => ({
          archetype: member.archetype,
          bonus: crewCheckBonus(member),
          id: member.id,
          name: member.name,
          skill: CREW_ARCHETYPES[member.archetype].skill,
          tier: member.tier,
        }),
      );

      const staminaCost = Math.round(
        JobCalculatorService.staminaCost(
          template,
          offer.difficulty,
          this.engine.config,
        ) * perks.staminaCostFactor,
      );
      if (current.resources.stamina < staminaCost) {
        throw new HttpError(
          400,
          "You're running on empty. Rest up before you move on a block.",
        );
      }

      const context = PlayerContextService.withCrew(
        PlayerContextService.fromPlayer(current),
        crewSnapshots,
      );
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
        claim,
        createdAt: nowIso,
        ...(crewSnapshots.length > 0 && { crew: crewSnapshots }),
        currentNodeId: ROOT_NODE_ID,
        depth: template.depth,
        generationStartedAt: null,
        id: missionId,
        momentumBands: MomentumService.bands(template.depth, this.engine.config),
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
      for (const member of crewMembers) {
        tx.set(crewRefs[crewIds.indexOf(member.id)]!, {
          ...member,
          assignment: missionId,
          status: "on_job",
          updatedAt: nowIso,
        });
      }
      tx.create(missionRef, created);
      return created;
    });

    this.startNarration(mission, player);
    return mission;
  }

  async acceptJob(
    player: Player,
    offerId: string,
    crewIds: string[] = [],
  ): Promise<Mission> {
    const missionId = randomUUID();
    const seed = randomBytes(16).toString("hex");
    const nowIso = new Date().toISOString();
    const perks = await this.effects.forPlayer(player.id);
    const boardRef = this.board.boardRef(player.id);
    const missionRef = this.missions(player.id).doc(missionId);
    const playerRef = this.db.collection("players").doc(player.id);
    const activeQuery = this.activeMissionQuery(player.id);

    const mission = await this.db.runTransaction(async (tx) => {
      const crewRefs = crewIds.map((id) =>
        this.db
          .collection("players")
          .doc(player.id)
          .collection("crew")
          .doc(id),
      );
      const [boardSnap, activeSnap, playerSnap, ...crewSnaps] =
        await Promise.all([
          tx.get(boardRef),
          tx.get(activeQuery),
          tx.get(playerRef),
          ...crewRefs.map((ref) => tx.get(ref)),
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

      const capacity = crewJobCapacity(current.progression.skills.leadership);
      if (crewIds.length > capacity) {
        throw new HttpError(
          400,
          `Your leadership carries ${capacity} on a job — no more.`,
        );
      }
      const crewMembers = crewSnaps.map((snap, i) => {
        if (!snap.exists) {
          throw new HttpError(404, `No such crew member: ${crewIds[i]}.`);
        }
        const member = normalizeCrewMember(snap.data() as CrewMember);
        if (member.status !== "idle") {
          throw new HttpError(409, `${member.name} isn't free for a job.`);
        }
        return member;
      });
      const crewSnapshots: MissionCrewSnapshot[] = crewMembers.map(
        (member) => ({
          archetype: member.archetype,
          bonus: crewCheckBonus(member),
          id: member.id,
          name: member.name,
          skill: CREW_ARCHETYPES[member.archetype].skill,
          tier: member.tier,
        }),
      );

      const boardData = boardSnap.exists ? (boardSnap.data() as JobBoard) : null;
      if (!boardData || !this.board.isCurrent(boardData)) {
        throw new HttpError(409, "The job board changed. Refresh and choose again.");
      }
      const offer = boardData.offers.find((o) => o.id === offerId);
      if (!offer) {
        throw new HttpError(404, "That job is no longer on the board.");
      }

      const template = this.localizedTemplate(
        this.templates.find(offer.templateId) ?? this.templates.first(),
        offer,
      );

      // Every job costs energy; drugs or idle time buy it back. Freight
      // yard holders move light.
      const staminaCost = Math.round(
        JobCalculatorService.staminaCost(
          template,
          offer.difficulty,
          this.engine.config,
        ) * perks.staminaCostFactor,
      );
      if (current.resources.stamina < staminaCost) {
        throw new HttpError(
          400,
          "You're running on empty. Rest up or find something at the store.",
        );
      }

      const context = PlayerContextService.withCrew(
        PlayerContextService.fromPlayer(current),
        crewSnapshots,
      );
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
        ...(crewSnapshots.length > 0 && { crew: crewSnapshots }),
        currentNodeId: ROOT_NODE_ID,
        depth: template.depth,
        generationStartedAt: null,
        id: missionId,
        momentumBands: MomentumService.bands(
          template.depth,
          this.engine.config,
        ),
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
      for (const member of crewMembers) {
        tx.set(crewRefs[crewIds.indexOf(member.id)]!, {
          ...member,
          assignment: missionId,
          status: "on_job",
          updatedAt: nowIso,
        });
      }
      tx.create(missionRef, created);
      return created;
    });

    this.startNarration(mission, player);
    return mission;
  }

  /**
   * Carries the offer's gear labels — written in the player's language at
   * board time, index-aligned with the template's gear list — into the
   * template, so in-mission gear text matches the board. Tags and every
   * mechanical field stay untouched.
   */
  private localizedTemplate(
    template: MissionTemplate,
    offer: JobOffer,
  ): MissionTemplate {
    if (!offer.gear?.length || !template.gear?.length) {
      return template;
    }

    return {
      ...template,
      gear: template.gear.map((entry, index) => ({
        ...entry,
        label: offer.gear?.[index]?.label ?? entry.label,
      })),
    };
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
    const perks = await this.effects.forPlayer(player.id);
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
      // Missing gear hard-locks a path on stakes-era missions; older
      // active missions keep their improvise behavior.
      if (edge.stakes && edge.gear && !edge.gear.satisfied) {
        throw new HttpError(
          400,
          `You don't have the ${edge.gear.label} that move needs.`,
        );
      }

      const target = mission.nodes[edge.id];
      if (!target) {
        throw new HttpError(500, "Mission tree is corrupted.");
      }
      if (target.narrativeStatus === "pending") {
        throw new HttpError(409, "still_generating");
      }

      // Heading into an outcome with crew aboard: read their docs now —
      // every transaction read must precede the first write.
      const crewOnJob = mission.crew ?? [];
      const crewRefs = crewOnJob.map((member) =>
        playerRef.collection("crew").doc(member.id),
      );
      const crewSnaps =
        target.kind === "outcome" && crewRefs.length > 0
          ? await Promise.all(crewRefs.map((ref) => tx.get(ref)))
          : [];
      // A takeover heading into its outcome also needs the contested turf.
      const claimTurfSnap =
        target.kind === "outcome" && mission.claim
          ? await tx.get(
              this.db
                .collection("seasons")
                .doc(mission.claim.seasonId)
                .collection("turfs")
                .doc(mission.claim.turfId),
            )
          : null;

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
      // The approach's own price: bribes are paid win or lose (a broke
      // player scrapes together what they have) and a botched loud move
      // marks you. Recorded on the edge so the step recap can show it.
      edge.cashSpent = Math.min(
        afterDamage.resources.cash,
        edge.cashCost ?? 0,
      );
      edge.heatGained = edge.roll.passed
        ? 0
        : Math.min(
            edge.heatOnFail ?? 0,
            Math.max(0, MAX_HEAT - afterDamage.resources.heat),
          );
      let updatedPlayer: Player = {
        ...afterDamage,
        resources: {
          ...afterDamage.resources,
          cash: afterDamage.resources.cash - edge.cashSpent,
          heat: afterDamage.resources.heat + edge.heatGained,
        },
        reservedEquipment: {
          items: SkeletonBuilder.reservationsForSubtree(
            mission.nodes,
            target.id,
          ),
          missionId: mission.id,
        },
        updatedAt: nowIso,
      };

      let claimedTurf: TurfState | null = null;
      if (target.kind === "outcome") {
        const crewMembers = crewSnaps
          .filter((snap) => snap.exists)
          .map((snap) => normalizeCrewMember(snap.data() as CrewMember));
        updatedPlayer = this.resolve(
          tx,
          mission,
          template,
          target,
          updatedPlayer,
          playerRef,
          eventId,
          nowIso,
          crewMembers,
          perks.crewHealFactor,
        );

        // A takeover that ended on its feet plants the flag — atomically
        // with the rewards, and only if the block is still unclaimed.
        const tier = mission.resolution?.tier;
        const won =
          tier === "jackpot" ||
          tier === "successful" ||
          tier === "partially_successful";
        if (mission.claim && claimTurfSnap?.exists && won) {
          const turf = claimTurfSnap.data() as TurfState;
          if (turf.ownerUid === null) {
            claimedTurf = {
              ...turf,
              claimedAt: nowIso,
              incomeAccruedAt: nowIso,
              ownerColor: updatedPlayer.family?.color ?? "#888888",
              ownerName: updatedPlayer.family?.name ?? updatedPlayer.name,
              ownerUid: updatedPlayer.id,
              shieldUntil: new Date(
                Date.parse(nowIso) + CAPTURE_SHIELD_HOURS * 3_600_000,
              ).toISOString(),
              updatedAt: nowIso,
            };
            tx.set(claimTurfSnap.ref, claimedTurf);
          }
        }
      } else {
        tx.set(playerRef, updatedPlayer);
      }

      tx.set(missionRef, mission);
      return { claimedTurf, mission, player: updatedPlayer };
    });

    await this.notifyCrewFates(player.id, result.mission);
    // Jackpot jobs make a name — a family in the map game scores respect.
    if (
      result.mission.resolution?.tier === "jackpot" &&
      result.player.family
    ) {
      const season = await this.seasons.getActiveSeason();
      await this.db
        .collection("seasons")
        .doc(season.id)
        .collection("respect")
        .doc(result.player.id)
        .set(
          {
            familyColor: result.player.family.color,
            familyName: result.player.family.name,
            respect: FieldValue.increment(RESPECT_WEIGHTS.jackpotMission),
            uid: result.player.id,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
    }
    if (result.claimedTurf && result.mission.claim) {
      const familyName = result.player.family?.name ?? result.player.name;
      await this.worldEvents.emit(
        result.mission.claim.seasonId,
        "turf_claimed",
        `The ${familyName} family claimed ${result.claimedTurf.name} in ${DISTRICTS[result.claimedTurf.district].label}.`,
        {
          actorName: familyName,
          actorUid: result.player.id,
          district: result.claimedTurf.district,
        },
      );
    }
    return { mission: result.mission, player: result.player };
  }

  /** Post-transaction: tell the player what the job cost the roster. */
  private async notifyCrewFates(uid: string, mission: Mission): Promise<void> {
    const outcomes = mission.resolution?.crewOutcomes ?? [];
    const location = mission.offer.storySeed.location;

    await Promise.all(
      outcomes.map((outcome) => {
        switch (outcome.fate) {
          case "killed":
            return this.notifications.push(
              uid,
              "crew_died",
              `${outcome.name} didn't make it`,
              `${outcome.name} went down on the ${location} job. His gear went with him.`,
              mission.id,
            );
          case "imprisoned":
            return this.notifications.push(
              uid,
              "crew_released",
              `${outcome.name} got pinched`,
              `The police took ${outcome.name} on the ${location} job — and everything he was carrying. A bribe could bring both back.`,
              mission.id,
            );
          case "injured":
            return this.notifications.push(
              uid,
              "crew_recovered",
              `${outcome.name} got hurt`,
              `${outcome.name} took a beating on the ${location} job. He needs time off his feet.`,
              mission.id,
            );
          default:
            return Promise.resolve();
        }
      }),
    );
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
    crewMembers: CrewMember[] = [],
    crewHealFactor = 1,
  ): Player {
    const tier = outcome.outcomeTier ?? "partial_failure";
    const crewOutcomes = this.settleCrewFates(
      tx,
      mission,
      tier === "disaster",
      tier === "jackpot" || tier === "successful",
      crewMembers,
      playerRef,
      nowIso,
      crewHealFactor,
    );
    // Hotheads make a bust louder; discreet hands muffle it.
    const crewHeatShift =
      tier === "disaster"
        ? crewMembers.reduce(
            (sum, member) =>
              sum + (crewTraitModifiers(member.traits).heatOnDisaster ?? 0),
            0,
          )
        : 0;
    const rewards = RewardService.mitigateHeat(
      RewardService.rewardsForTier(tier, mission.offer, template),
      mission.acceptedState?.loadout ?? player.loadout,
    );
    const summary =
      outcome.narrative?.storySummary ??
      `The ${mission.offer.storySeed.location} job ended in ${tier.replace(/_/g, " ")}.`;

    const applied = RewardService.applyToPlayer(player, rewards, nowIso);
    if (crewHeatShift !== 0) {
      applied.player.resources.heat = Math.min(
        MAX_HEAT,
        Math.max(0, applied.player.resources.heat + crewHeatShift),
      );
    }
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
      ...(crewOutcomes.length > 0 && { crewOutcomes }),
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
   * Sends the crew home — or to the hospital, the county lockup, or the
   * ground. Fates are seeded off the mission so retries can't reroll
   * them. A disaster means the police closed in: some get hurt, some get
   * taken (gear confiscated with them), most scatter, and the unlucky
   * don't come back at all — cowards always run fast enough to live.
   */
  private settleCrewFates(
    tx: FirebaseFirestore.Transaction,
    mission: Mission,
    disaster: boolean,
    triumph: boolean,
    crewMembers: CrewMember[],
    playerRef: DocumentReference,
    nowIso: string,
    crewHealFactor = 1,
  ): MissionCrewOutcome[] {
    if (crewMembers.length === 0) {
      return [];
    }

    const rng = new MissionRng(mission.seed, mission.id);
    const outcomes: MissionCrewOutcome[] = [];

    for (const member of crewMembers) {
      const ref = playerRef.collection("crew").doc(member.id);
      const home: CrewMember = {
        ...member,
        assignment: null,
        busyUntil: null,
        loyalty: triumph
          ? Math.min(MAX_CREW_LOYALTY, member.loyalty + 2)
          : member.loyalty,
        status: "idle",
        updatedAt: nowIso,
      };

      if (!disaster) {
        tx.set(ref, home);
        outcomes.push({ fate: "returned", id: member.id, name: member.name });
        continue;
      }

      const roll = rng.rollD100(`crew-fate:${member.id}`);
      if (roll <= 35) {
        tx.set(ref, {
          ...home,
          busyUntil: new Date(
            Date.parse(nowIso) +
              CREW_INJURY_RECOVERY_HOURS * crewHealFactor * 3_600_000,
          ).toISOString(),
          status: "injured",
        });
        outcomes.push({ fate: "injured", id: member.id, name: member.name });
      } else if (roll <= 60) {
        tx.set(ref, {
          ...home,
          busyUntil: new Date(
            Date.parse(nowIso) + CREW_PRISON_HOURS * 3_600_000,
          ).toISOString(),
          confiscatedLoadout: member.loadout,
          loadout: {},
          status: "imprisoned",
        });
        outcomes.push({ fate: "imprisoned", id: member.id, name: member.name });
      } else if (
        roll <= 90 ||
        crewTraitModifiers(member.traits).fleesDeath === true
      ) {
        tx.set(ref, home);
        outcomes.push({ fate: "escaped", id: member.id, name: member.name });
      } else {
        tx.delete(ref);
        outcomes.push({ fate: "killed", id: member.id, name: member.name });
      }
    }

    return outcomes;
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
