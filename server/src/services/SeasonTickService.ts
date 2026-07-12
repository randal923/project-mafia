import { FieldValue, Firestore } from "firebase-admin/firestore";
import { DISTRICT_IDS, DISTRICTS } from "../../../shared/district";
import { BattleReport } from "../../../shared/battle";
import { MAX_HEAT, Player } from "../../../shared/player";
import {
  CONQUEST_HOLD_HOURS,
  CRACKDOWN_HEAT,
  CRACKDOWN_INTERVAL_DAYS,
  RESPECT_WEIGHTS,
  SEASON_RACKET_REFUND_FACTOR,
  Season,
  SeasonTickMeta,
  SeasonWinner,
} from "../../../shared/season";
import { TurfState } from "../../../shared/territory";
import {
  buildingTotalInvested,
} from "../../../shared/building";
import { buildingDefinition } from "../../../shared/buildingCatalog";
import { FirebaseService } from "./FirebaseService";
import { NewspaperService } from "./NewspaperService";
import { NotificationService } from "./NotificationService";
import { SeasonService } from "./SeasonService";
import { WorldEventService } from "./WorldEventService";

export type TickResult = {
  crackdown: string | null;
  editionPublished: boolean;
  respectScored: boolean;
  seasonEnded: boolean;
  strongholdHolder: string | null;
};

/**
 * The scheduled heartbeat (Cloud Scheduler → POST /internal/tick). All the
 * shared-world consequences that can't wait for a player to log in:
 * respect accrual, the conquest clock, the weekly crackdown, newspaper
 * editions, and the end of the season itself. Player-scoped mechanics
 * stay lazy-on-read; only the shared world ticks.
 */
export class SeasonTickService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly seasons: SeasonService,
    private readonly newspaper: NewspaperService,
    private readonly worldEvents: WorldEventService,
    private readonly notifications: NotificationService,
  ) {
    this.db = firebase.firestore;
  }

  async tick(): Promise<TickResult> {
    const season = await this.seasons.getActiveSeason();
    const nowIso = new Date().toISOString();
    const meta = await this.readMeta(season, nowIso);

    const turfSnap = await this.seasons.turfsRef(season.id).get();
    const turfs = turfSnap.docs.map((doc) => doc.data() as TurfState);

    const respectScored = await this.scoreRespect(season, turfs, meta, nowIso);
    const strongholdHolder = await this.checkConquest(season, turfs, nowIso);
    const crackdown = await this.runCrackdown(season, meta, nowIso);
    const edition = await this.newspaper.generateIfDue(
      season,
      meta.lastEditionAt,
    );

    let seasonEnded = false;
    const conquestWinner = await this.conquestComplete(season, nowIso);
    if (conquestWinner) {
      await this.endSeason(season, turfs, conquestWinner);
      seasonEnded = true;
    } else if (Date.parse(season.endsAt) <= Date.parse(nowIso)) {
      const winner = await this.respectWinner(season);
      await this.endSeason(season, turfs, winner);
      seasonEnded = true;
    }

    await this.writeMeta(season, {
      lastCrackdownAt: crackdown ? nowIso : meta.lastCrackdownAt,
      lastEditionAt: edition ? nowIso : meta.lastEditionAt,
      lastScoredAt: nowIso,
    });

    return {
      crackdown,
      editionPublished: Boolean(edition),
      respectScored,
      seasonEnded,
      strongholdHolder,
    };
  }

  /** Turf-hours become respect, weighted by district; landmarks score extra. */
  private async scoreRespect(
    season: Season,
    turfs: TurfState[],
    meta: SeasonTickMeta,
    nowIso: string,
  ): Promise<boolean> {
    const hours = Math.max(
      0,
      (Date.parse(nowIso) - Date.parse(meta.lastScoredAt)) / 3_600_000,
    );
    if (hours <= 0) {
      return false;
    }

    const byOwner = new Map<
      string,
      { color: string; landmarks: number; name: string; respect: number; turfs: number }
    >();

    for (const turf of turfs) {
      if (!turf.ownerUid) {
        continue;
      }
      const entry = byOwner.get(turf.ownerUid) ?? {
        color: turf.ownerColor ?? "#888888",
        landmarks: 0,
        name: turf.ownerName ?? "",
        respect: 0,
        turfs: 0,
      };
      entry.turfs += 1;
      entry.respect +=
        hours * RESPECT_WEIGHTS.turfHour * DISTRICTS[turf.district].respectWeight;
      if (turf.landmarkId) {
        entry.landmarks += 1;
        entry.respect += hours * RESPECT_WEIGHTS.landmarkHour;
      }
      byOwner.set(turf.ownerUid, entry);
    }

    const batch = this.db.batch();
    for (const [uid, entry] of byOwner) {
      batch.set(
        this.db
          .collection("seasons")
          .doc(season.id)
          .collection("respect")
          .doc(uid),
        {
          familyColor: entry.color,
          familyName: entry.name,
          landmarkCount: entry.landmarks,
          respect: FieldValue.increment(entry.respect),
          scoredAt: nowIso,
          turfCount: entry.turfs,
          uid,
          updatedAt: nowIso,
        },
        { merge: true },
      );
    }
    await batch.commit();
    return byOwner.size > 0;
  }

  /**
   * The conquest clock: holding all seven district strongholds starts a
   * public 72-hour countdown; losing any block stops it. Front-page news
   * in both directions.
   */
  private async checkConquest(
    season: Season,
    turfs: TurfState[],
    nowIso: string,
  ): Promise<string | null> {
    const holder = this.strongholdHolder(turfs);
    const countdown = season.strongholdCountdown;

    if (holder && (!countdown || countdown.uid !== holder.uid)) {
      await this.seasons.seasonRef(season.id).update({
        strongholdCountdown: {
          familyName: holder.name,
          startedAt: nowIso,
          uid: holder.uid,
        },
        updatedAt: nowIso,
      });
      this.seasons.invalidateCache();
      await this.worldEvents.emit(
        season.id,
        "stronghold_countdown",
        `The ${holder.name} family holds every district in the city. If they stand for ${CONQUEST_HOLD_HOURS} hours, the city is theirs.`,
        { actorName: holder.name, actorUid: holder.uid },
      );
    } else if (!holder && countdown) {
      await this.seasons.seasonRef(season.id).update({
        strongholdCountdown: null,
        updatedAt: nowIso,
      });
      this.seasons.invalidateCache();
      await this.worldEvents.emit(
        season.id,
        "stronghold_countdown_broken",
        `The ${countdown.familyName} family's grip on the city has been broken. The conquest clock stops.`,
        { actorName: countdown.familyName, actorUid: countdown.uid },
      );
    }

    return holder?.name ?? null;
  }

  /** One family owning every turf of every district, or null. */
  private strongholdHolder(
    turfs: TurfState[],
  ): { name: string; uid: string } | null {
    let holder: { name: string; uid: string } | null = null;

    for (const district of DISTRICT_IDS) {
      const districtTurfs = turfs.filter((t) => t.district === district);
      const owner = districtTurfs[0]?.ownerUid;
      if (!owner || districtTurfs.some((t) => t.ownerUid !== owner)) {
        return null;
      }
      if (holder && holder.uid !== owner) {
        return null;
      }
      holder = {
        name: districtTurfs[0]!.ownerName ?? "",
        uid: owner,
      };
    }

    return holder;
  }

  private async conquestComplete(
    season: Season,
    nowIso: string,
  ): Promise<SeasonWinner | null> {
    const fresh = (
      await this.seasons.seasonRef(season.id).get()
    ).data() as Season;
    const countdown = fresh.strongholdCountdown;
    if (!countdown) {
      return null;
    }

    const heldHours =
      (Date.parse(nowIso) - Date.parse(countdown.startedAt)) / 3_600_000;
    if (heldHours < CONQUEST_HOLD_HOURS) {
      return null;
    }

    const playerSnap = await this.db
      .collection("players")
      .doc(countdown.uid)
      .get();
    const player = playerSnap.data() as Player | undefined;

    return {
      familyColor: player?.family?.color ?? "#888888",
      familyName: countdown.familyName,
      uid: countdown.uid,
      victoryType: "conquest",
    };
  }

  private async respectWinner(season: Season): Promise<SeasonWinner | null> {
    const snapshot = await this.db
      .collection("seasons")
      .doc(season.id)
      .collection("respect")
      .orderBy("respect", "desc")
      .limit(1)
      .get();

    const top = snapshot.docs[0]?.data();
    if (!top) {
      return null;
    }
    return {
      familyColor: top.familyColor,
      familyName: top.familyName,
      uid: top.uid,
      victoryType: "respect",
    };
  }

  /** Weekly: the family that fought the most wears the city's anger. */
  private async runCrackdown(
    season: Season,
    meta: SeasonTickMeta,
    nowIso: string,
  ): Promise<string | null> {
    const daysSince =
      (Date.parse(nowIso) - Date.parse(meta.lastCrackdownAt)) / 86_400_000;
    if (daysSince < CRACKDOWN_INTERVAL_DAYS) {
      return null;
    }

    const battlesSnap = await this.db
      .collection("seasons")
      .doc(season.id)
      .collection("battles")
      .where("createdAt", ">", meta.lastCrackdownAt)
      .get();

    const attacksByUid = new Map<string, { count: number; name: string }>();
    for (const doc of battlesSnap.docs) {
      const battle = doc.data() as BattleReport;
      const entry = attacksByUid.get(battle.attackerUid) ?? {
        count: 0,
        name: battle.attackerName,
      };
      entry.count += 1;
      attacksByUid.set(battle.attackerUid, entry);
    }

    const loudest = [...attacksByUid.entries()].sort(
      (a, b) => b[1].count - a[1].count,
    )[0];
    if (!loudest || loudest[1].count === 0) {
      return null;
    }

    const [uid, { name }] = loudest;
    const playerRef = this.db.collection("players").doc(uid);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists) {
        return;
      }
      const player = snap.data() as Player;
      tx.update(playerRef, {
        "resources.heat": Math.min(
          MAX_HEAT,
          (player.resources.heat ?? 0) + CRACKDOWN_HEAT,
        ),
        updatedAt: nowIso,
      });
    });

    await Promise.all([
      this.worldEvents.emit(
        season.id,
        "crackdown",
        `City hall announces a crackdown on the ${name} family after a week of open warfare. Expect roadblocks and warrants.`,
        { targetName: name, targetUid: uid },
      ),
      this.notifications.push(
        uid,
        {
          content: {
            messageId: "season_crackdown",
            params: { heat: CRACKDOWN_HEAT },
          },
          type: "season",
        },
      ),
    ]);

    return name;
  }

  /**
   * Season end: the winner takes the masthead; the map resets; racket
   * owners get a partial cash-out. Careers, crews, and personal holdings
   * carry into the next season untouched.
   */
  private async endSeason(
    season: Season,
    turfs: TurfState[],
    winner: SeasonWinner | null,
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    // Racket refunds: a slice of everything sunk into turf buildings.
    const refunds = new Map<string, number>();
    for (const turf of turfs) {
      if (!turf.ownerUid) {
        continue;
      }
      for (const building of turf.buildings) {
        const definition = buildingDefinition(building.definitionId);
        if (!definition || definition.class !== "racket") {
          continue;
        }
        const refund = Math.round(
          buildingTotalInvested(definition, building.level) *
            SEASON_RACKET_REFUND_FACTOR,
        );
        refunds.set(turf.ownerUid, (refunds.get(turf.ownerUid) ?? 0) + refund);
      }
    }

    const batch = this.db.batch();
    for (const [uid, refund] of refunds) {
      batch.update(this.db.collection("players").doc(uid), {
        "resources.cash": FieldValue.increment(refund),
        updatedAt: nowIso,
      });
    }
    batch.update(this.seasons.seasonRef(season.id), {
      status: "ended",
      updatedAt: nowIso,
      winner,
    });
    await batch.commit();

    await this.worldEvents.emit(
      season.id,
      "season_end",
      winner
        ? `The season is over. The ${winner.familyName} family ${winner.victoryType === "conquest" ? "conquered the city outright" : "ends the season with the most respect"} and takes the crown.`
        : "The season is over. No family rose above the rest; the city belongs to nobody.",
      winner ? { actorName: winner.familyName, actorUid: winner.uid } : {},
    );

    // The next season opens immediately, champion on the masthead.
    this.seasons.invalidateCache();
    await this.seasons.foundSeason(
      season.number + 1,
      winner?.familyName ?? season.champion,
    );
  }

  private async readMeta(
    season: Season,
    nowIso: string,
  ): Promise<SeasonTickMeta> {
    const snapshot = await this.metaRef(season.id).get();
    if (snapshot.exists) {
      return snapshot.data() as SeasonTickMeta;
    }
    return {
      lastCrackdownAt: season.startsAt,
      lastEditionAt: season.startsAt,
      lastScoredAt: nowIso,
    };
  }

  private async writeMeta(season: Season, meta: SeasonTickMeta): Promise<void> {
    await this.metaRef(season.id).set(meta);
  }

  private metaRef(seasonId: string) {
    return this.db
      .collection("seasons")
      .doc(seasonId)
      .collection("meta")
      .doc("tick");
  }
}
