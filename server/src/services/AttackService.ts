import {
  CollectionReference,
  FieldValue,
  Firestore,
} from "firebase-admin/firestore";
import { randomBytes, randomUUID } from "node:crypto";
import {
  ATTACK_COOLDOWN_MINUTES,
  ATTACK_HEAT,
  ATTACK_STAMINA_COST,
  BATTLE_CLASH_COUNT,
  BATTLE_TIER_BY_WINS,
  BattleCasualties,
  BattleCrewSnapshot,
  BattleReport,
  CAPTURE_SKIM_FACTOR,
  JACKPOT_SKIM_FACTOR,
  REVENGE_DEFENSE_FACTOR,
  REVENGE_WINDOW_HOURS,
  attackStake,
  clashWinChance,
  defenseDamageDealt,
} from "../../../shared/battle";
import { buildingDefinition } from "../../../shared/buildingCatalog";
import {
  CREW_INJURY_RECOVERY_HOURS,
  CREW_PRISON_HOURS,
  CrewMember,
  crewMemberPower,
  crewTraitModifiers,
  normalizeCrewMember,
} from "../../../shared/crew";
import { DISTRICTS } from "../../../shared/district";
import { RESPECT_WEIGHTS } from "../../../shared/season";
import {
  MAX_HEAT,
  Player,
  normalizePlayer,
} from "../../../shared/player";
import { calculatePlayerPower } from "../../../shared/playerPower";
import {
  CAPTURE_SHIELD_HOURS,
  NEW_FAMILY_SHIELD_HOURS,
  TurfState,
  canReachTurf,
  turfDefense,
} from "../../../shared/territory";
import { MissionRng } from "../engine/MissionRng";
import { HttpError } from "../middleware/errorHandler";
import { EffectsService } from "./EffectsService";
import { FirebaseService } from "./FirebaseService";
import { NewspaperService } from "./NewspaperService";
import { NotificationService } from "./NotificationService";
import { SeasonService } from "./SeasonService";
import { WorldEventService } from "./WorldEventService";

/** Landmark garrisons harden as the season ages. */
const GARRISON_GROWTH_PER_WEEK = 0.15;

/**
 * Asynchronous warfare: an attack resolves the moment it lands, through
 * the same seeded d100 machinery as jobs — attacker force against turf
 * defense, three clashes, outcome tiers. No live defender required; the
 * defender wakes up to a battle report either way.
 */
export class AttackService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly seasons: SeasonService,
    private readonly notifications: NotificationService,
    private readonly worldEvents: WorldEventService,
    private readonly effects: EffectsService,
    private readonly newspaper: NewspaperService,
  ) {
    this.db = firebase.firestore;
  }

  async attack(
    uid: string,
    turfId: string,
    crewIds: string[],
  ): Promise<BattleReport> {
    const season = await this.seasons.getActiveSeason();
    // The Ledger's standing bounty — collected on a flip against the target.
    const bounty = await this.newspaper.activeBounty();
    const perks = await this.effects.forPlayer(uid);
    const battleId = randomUUID();
    const seed = randomBytes(16).toString("hex");
    const nowIso = new Date().toISOString();
    const nowMs = Date.parse(nowIso);

    const turfRef = this.seasons.turfsRef(season.id).doc(turfId);
    const playerRef = this.db.collection("players").doc(uid);
    const battlesRef = this.battles(season.id);

    const result = await this.db.runTransaction(async (tx) => {
      // ---- reads (all before any write) ----
      const [turfSnap, playerSnap] = await Promise.all([
        tx.get(turfRef),
        tx.get(playerRef),
      ]);

      if (!turfSnap.exists) {
        throw new HttpError(404, "That turf doesn't exist.");
      }
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const turf = turfSnap.data() as TurfState;
      const attacker = normalizePlayer(playerSnap.data() as Player);

      if (!attacker.family) {
        throw new HttpError(403, "Found your family before you start a war.");
      }
      if (attacker.prison) {
        throw new HttpError(403, "You're in prison. The war can wait.");
      }
      if (turf.ownerUid === uid) {
        throw new HttpError(400, "That block already flies your flag.");
      }
      const siege = turf.ownerUid === null;
      if (siege && !turf.landmarkId) {
        throw new HttpError(
          409,
          "Unclaimed ground is taken with a takeover, not an assault.",
        );
      }
      if (turf.shieldUntil && Date.parse(turf.shieldUntil) > nowMs) {
        throw new HttpError(409, "That block is lying low — too soon to hit it.");
      }

      if (
        attacker.war.lastAttackAt &&
        nowMs - Date.parse(attacker.war.lastAttackAt) <
          ATTACK_COOLDOWN_MINUTES * 60_000
      ) {
        throw new HttpError(429, "Your soldiers are still regrouping.");
      }

      // Revenge: the token granted when this family lost a defense —
      // adjacency waived, the grudge target's defenses caught leaning.
      const revenge = Boolean(
        !siege &&
          turf.ownerUid &&
          attacker.war.revenge &&
          attacker.war.revenge.againstUid === turf.ownerUid &&
          Date.parse(attacker.war.revenge.expiresAt) > nowMs,
      );

      const ownedSnap = await tx.get(
        this.seasons.turfsRef(season.id).where("ownerUid", "==", uid),
      );
      const owned = ownedSnap.docs.map((doc) => doc.data() as TurfState);
      if (!revenge && owned.length > 0 && !canReachTurf(turf, owned)) {
        throw new HttpError(
          409,
          "Too far from your ground. March through the district, block by block.",
        );
      }
      if (!revenge && owned.length === 0 && !siege) {
        throw new HttpError(
          409,
          "Take ground of your own before you take someone else's.",
        );
      }

      const crewSnaps = await Promise.all(
        crewIds.map((id) => tx.get(playerRef.collection("crew").doc(id))),
      );
      const committed = crewSnaps.map((snap, i) => {
        if (!snap.exists) {
          throw new HttpError(404, `No such crew member: ${crewIds[i]}.`);
        }
        const member = normalizeCrewMember(snap.data() as CrewMember);
        if (member.status !== "idle") {
          throw new HttpError(409, `${member.name} isn't free to fight.`);
        }
        return member;
      });

      // Defender & their posted crew (or the NPC garrison).
      let defender: Player | null = null;
      let defenderCrew: CrewMember[] = [];
      let defensePower: number;

      if (siege) {
        const landmark = buildingDefinition(turf.landmarkId!);
        const weeks = Math.max(
          0,
          (nowMs - Date.parse(season.startsAt)) / (7 * 86_400_000),
        );
        const garrison = Math.round(
          (landmark?.garrisonPower ?? 100) *
            (1 + GARRISON_GROWTH_PER_WEEK * weeks),
        );
        defensePower = turfDefense(turf, garrison / 2);
      } else {
        const defenderRef = this.db.collection("players").doc(turf.ownerUid!);
        const defenderSnap = await tx.get(defenderRef);
        defender = defenderSnap.exists
          ? normalizePlayer(defenderSnap.data() as Player)
          : null;

        if (
          defender?.family &&
          nowMs - Date.parse(defender.family.foundedAt) <
            NEW_FAMILY_SHIELD_HOURS * 3_600_000
        ) {
          throw new HttpError(409, "That family is too green to hit — give it time.");
        }

        const defenderCrewSnaps = await Promise.all(
          turf.assignedCrew.map((id) =>
            tx.get(defenderRef.collection("crew").doc(id)),
          ),
        );
        defenderCrew = defenderCrewSnaps
          .filter((snap) => snap.exists)
          .map((snap) => normalizeCrewMember(snap.data() as CrewMember));

        const defenderCrewPower = defenderCrew.reduce(
          (sum, member) => sum + crewMemberPower(member),
          0,
        );
        defensePower = Math.round(
          turfDefense(turf, defenderCrewPower) *
            (revenge ? REVENGE_DEFENSE_FACTOR : 1),
        );
      }

      const stake = attackStake(defensePower);
      if (attacker.resources.stamina < ATTACK_STAMINA_COST) {
        throw new HttpError(400, "Your soldiers are willing; you're exhausted.");
      }
      if (attacker.resources.cash < stake) {
        throw new HttpError(402, `War costs money — this one takes $${stake}.`);
      }

      const attackPower =
        calculatePlayerPower(attacker) +
        committed.reduce((sum, member) => sum + crewMemberPower(member), 0);

      // ---- resolution (seeded, reproducible) ----
      const rng = new MissionRng(seed, battleId);
      const chance = clashWinChance(attackPower, defensePower);
      let wins = 0;
      for (let clash = 0; clash < BATTLE_CLASH_COUNT; clash += 1) {
        if (rng.rollD100(`clash:${clash}`) <= chance) {
          wins += 1;
        }
      }
      const tier = BATTLE_TIER_BY_WINS[wins]!;
      const flipped = wins >= 2;

      // ---- consequences ----
      const attackerCasualties: BattleCasualties = {
        dead: [],
        imprisoned: [],
        injured: [],
      };
      const defenderCasualties: BattleCasualties = {
        dead: [],
        imprisoned: [],
        injured: [],
      };

      // A rout costs the attacker bodies; a lost defense bruises the guards.
      if (tier === "disaster") {
        this.applyAttackerCasualties(
          tx,
          playerRef,
          committed,
          rng,
          nowIso,
          attackerCasualties,
          perks.crewHealFactor,
        );
      } else {
        for (const member of committed) {
          tx.set(playerRef.collection("crew").doc(member.id), {
            ...member,
            updatedAt: nowIso,
          });
        }
      }
      if (flipped && !siege && turf.ownerUid) {
        const defenderRef = this.db.collection("players").doc(turf.ownerUid);
        for (const member of defenderCrew) {
          const hurt = rng.rollD100(`defender-fate:${member.id}`) <= 50;
          const updated: CrewMember = {
            ...member,
            assignment: null,
            busyUntil: hurt
              ? new Date(
                  nowMs + CREW_INJURY_RECOVERY_HOURS * 3_600_000,
                ).toISOString()
              : null,
            status: hurt ? "injured" : "idle",
            updatedAt: nowIso,
          };
          tx.set(defenderRef.collection("crew").doc(member.id), updated);
          if (hurt) {
            defenderCasualties.injured.push(this.snapshotMember(member));
          }
        }
      }

      // Money moves: tills are skimmed on a capture, all of it on a sweep.
      let skimmed = 0;
      let bountyCollected = 0;
      if (flipped) {
        const skimFactor =
          tier === "jackpot" ? JACKPOT_SKIM_FACTOR : CAPTURE_SKIM_FACTOR;
        const tills =
          turf.storedIncome +
          turf.buildings.reduce((sum, b) => sum + b.storedIncome, 0);
        skimmed = Math.floor(tills * skimFactor);

        if (bounty && !siege && turf.ownerUid === bounty.targetUid) {
          bountyCollected = bounty.bounty;
        }
      }

      // The turf itself: flips damaged, or holds with dents.
      if (flipped) {
        tx.set(turfRef, {
          ...turf,
          assignedCrew: [],
          buildings: turf.buildings.map((building) => ({
            ...building,
            damaged: true,
            staff: [],
            storedIncome: 0,
            updatedAt: nowIso,
          })),
          claimedAt: nowIso,
          defenseDamage: 0,
          incomeAccruedAt: nowIso,
          ownerColor: attacker.family.color,
          ownerName: attacker.family.name,
          ownerUid: uid,
          shieldUntil: new Date(
            nowMs + CAPTURE_SHIELD_HOURS * 3_600_000,
          ).toISOString(),
          storedIncome: 0,
          updatedAt: nowIso,
        });
      } else if (tier === "partial_failure") {
        tx.set(turfRef, {
          ...turf,
          defenseDamage: turf.defenseDamage + defenseDamageDealt(defensePower),
          updatedAt: nowIso,
        });
      }

      const heatGained = tier === "disaster" ? ATTACK_HEAT * 2 : ATTACK_HEAT;
      tx.set(playerRef, {
        ...attacker,
        resources: {
          ...attacker.resources,
          cash: attacker.resources.cash - stake + skimmed + bountyCollected,
          heat: Math.min(MAX_HEAT, attacker.resources.heat + heatGained),
          stamina: attacker.resources.stamina - ATTACK_STAMINA_COST,
        },
        updatedAt: nowIso,
        war: {
          lastAttackAt: nowIso,
          // A revenge strike spends the token, win or lose.
          revenge: revenge ? null : attacker.war.revenge,
        },
      });

      // Losing a defense grants the defender 24 hours of revenge.
      if (flipped && defender) {
        tx.set(this.db.collection("players").doc(defender.id), {
          ...defender,
          updatedAt: nowIso,
          war: {
            ...defender.war,
            revenge: {
              againstUid: uid,
              expiresAt: new Date(
                nowMs + REVENGE_WINDOW_HOURS * 3_600_000,
              ).toISOString(),
            },
          },
        });
      }

      // Respect: battles won score; landmark captures score loud.
      if (flipped) {
        const respectRef = this.db
          .collection("seasons")
          .doc(season.id)
          .collection("respect")
          .doc(uid);
        tx.set(
          respectRef,
          {
            familyColor: attacker.family.color,
            familyName: attacker.family.name,
            respect: FieldValue.increment(
              RESPECT_WEIGHTS.battleWon +
                (siege ? RESPECT_WEIGHTS.landmarkCaptured : 0),
            ),
            uid,
            updatedAt: nowIso,
          },
          { merge: true },
        );
      }

      const report: BattleReport = {
        attackerCasualties,
        attackerCrew: committed.map((member) => this.snapshotMember(member)),
        attackerName: attacker.family.name,
        attackerUid: uid,
        attackPower,
        ...(bountyCollected > 0 && { bountyCollected }),
        clashChance: chance,
        clashesWon: wins,
        createdAt: nowIso,
        defenderCasualties,
        defenderName: siege ? null : (turf.ownerName ?? null),
        defenderUid: siege ? null : turf.ownerUid,
        defensePower,
        heatGained,
        id: battleId,
        incomeSkimmed: skimmed,
        kind: siege ? "landmark_siege" : "turf_assault",
        revenge,
        seasonId: season.id,
        stake,
        tier,
        turfFlipped: flipped,
        turfId,
        turfName: turf.name,
      };
      tx.create(battlesRef.doc(battleId), report);

      return { report, turf };
    });

    await this.publishBattle(result.report, result.turf);
    this.effects.invalidate(uid);
    if (result.report.defenderUid) {
      this.effects.invalidate(result.report.defenderUid);
    }
    return result.report;
  }

  /**
   * Battles the player fought, either side, newest first. Equality-only
   * queries (sorted in memory) so no composite Firestore index is needed.
   */
  async recentBattles(uid: string): Promise<BattleReport[]> {
    const season = await this.seasons.getActiveSeason();
    const battles = this.battles(season.id);

    const [asAttacker, asDefender] = await Promise.all([
      battles.where("attackerUid", "==", uid).limit(50).get(),
      battles.where("defenderUid", "==", uid).limit(50).get(),
    ]);

    return [...asAttacker.docs, ...asDefender.docs]
      .map((doc) => doc.data() as BattleReport)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }

  private applyAttackerCasualties(
    tx: FirebaseFirestore.Transaction,
    playerRef: FirebaseFirestore.DocumentReference,
    committed: CrewMember[],
    rng: MissionRng,
    nowIso: string,
    casualties: BattleCasualties,
    crewHealFactor = 1,
  ): void {
    const nowMs = Date.parse(nowIso);

    for (const member of committed) {
      const ref = playerRef.collection("crew").doc(member.id);
      const roll = rng.rollD100(`attacker-fate:${member.id}`);

      if (roll <= 40) {
        casualties.injured.push(this.snapshotMember(member));
        tx.set(ref, {
          ...member,
          busyUntil: new Date(
            nowMs + CREW_INJURY_RECOVERY_HOURS * crewHealFactor * 3_600_000,
          ).toISOString(),
          status: "injured",
          updatedAt: nowIso,
        });
      } else if (roll <= 65) {
        casualties.imprisoned.push(this.snapshotMember(member));
        tx.set(ref, {
          ...member,
          busyUntil: new Date(
            nowMs + CREW_PRISON_HOURS * 3_600_000,
          ).toISOString(),
          confiscatedLoadout: member.loadout,
          loadout: {},
          status: "imprisoned",
          updatedAt: nowIso,
        });
      } else if (
        roll <= 92 ||
        crewTraitModifiers(member.traits).fleesDeath === true
      ) {
        tx.set(ref, { ...member, updatedAt: nowIso });
      } else {
        casualties.dead.push(this.snapshotMember(member));
        tx.delete(ref);
      }
    }
  }

  /** Notifications and front-page facts, after the transaction commits. */
  private async publishBattle(
    report: BattleReport,
    turf: TurfState,
  ): Promise<void> {
    const district = DISTRICTS[turf.district].label;
    const tasks: Promise<void>[] = [];

    if (report.kind === "landmark_siege") {
      if (report.turfFlipped) {
        tasks.push(
          this.worldEvents.emit(
            report.seasonId,
            "landmark_captured",
            `${report.attackerName} stormed ${turf.name} in ${district} and took it from its keepers.`,
            {
              actorName: report.attackerName,
              actorUid: report.attackerUid,
              district: turf.district,
            },
          ),
        );
      }
    } else {
      tasks.push(
        this.worldEvents.emit(
          report.seasonId,
          report.turfFlipped ? "turf_captured" : "battle",
          report.turfFlipped
            ? `${report.attackerName} took ${turf.name} in ${district} from ${report.defenderName}.`
            : `${report.attackerName} moved on ${turf.name} in ${district}; ${report.defenderName} held the block.`,
          {
            actorName: report.attackerName,
            actorUid: report.attackerUid,
            district: turf.district,
            targetName: report.defenderName,
            targetUid: report.defenderUid,
          },
        ),
      );
    }

    if (report.defenderUid) {
      tasks.push(
        report.turfFlipped
          ? this.notifications.push(
              report.defenderUid,
              "turf_lost",
              `You lost ${turf.name}`,
              `${report.attackerName} took ${turf.name} in ${district}. You have 24 hours of revenge — hit back anywhere on their map.`,
              report.id,
            )
          : this.notifications.push(
              report.defenderUid,
              "turf_defended",
              `${turf.name} held`,
              `${report.attackerName} came for ${turf.name} and your defenses turned them away.`,
              report.id,
            ),
      );
    }

    await Promise.all(tasks);
  }

  private snapshotMember(member: CrewMember): BattleCrewSnapshot {
    return {
      id: member.id,
      name: member.name,
      power: crewMemberPower(member),
    };
  }

  private battles(seasonId: string): CollectionReference {
    return this.db.collection("seasons").doc(seasonId).collection("battles");
  }
}
