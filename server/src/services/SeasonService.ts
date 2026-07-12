import {
  CollectionReference,
  DocumentReference,
  Firestore,
} from "firebase-admin/firestore";
import { CITY_TURFS } from "../../../shared/cityMap";
import { SEASON_LENGTH_DAYS, Season } from "../../../shared/season";
import { TurfState } from "../../../shared/territory";
import { EffectsService } from "./EffectsService";
import { FirebaseService } from "./FirebaseService";

const SEASON_CACHE_TTL_MS = 60_000;

/**
 * Season lifecycle. One city, one active season at a time. The first
 * request that finds no active season founds Season 1 and lays down all
 * seventy turfs from the city map seed. Scoring, victory checks, and the
 * end-of-season reset run through the scheduled tick (SeasonTickService).
 */
export class SeasonService {
  private readonly db: Firestore;
  private cached: { at: number; season: Season } | null = null;

  constructor(
    firebase: FirebaseService,
    private readonly effects: EffectsService,
  ) {
    this.db = firebase.firestore;
  }

  async getActiveSeason(): Promise<Season> {
    if (this.cached && Date.now() - this.cached.at < SEASON_CACHE_TTL_MS) {
      return this.cached.season;
    }

    const snapshot = await this.seasons
      .where("status", "==", "active")
      .limit(1)
      .get();

    const season = snapshot.empty
      ? await this.foundSeason(1)
      : (snapshot.docs[0]!.data() as Season);

    this.cached = { at: Date.now(), season };
    this.effects.bindSeason(season.id);
    return season;
  }

  invalidateCache(): void {
    this.cached = null;
  }

  /** Creates a season and seeds every turf from the city map. */
  async foundSeason(number: number, champion: string | null = null): Promise<Season> {
    const nowIso = new Date().toISOString();
    const season: Season = {
      champion,
      createdAt: nowIso,
      endsAt: new Date(
        Date.now() + SEASON_LENGTH_DAYS * 86_400_000,
      ).toISOString(),
      id: `season-${number}`,
      name: `Season ${number}`,
      number,
      startsAt: nowIso,
      status: "active",
      strongholdCountdown: null,
      updatedAt: nowIso,
      winner: null,
    };

    // create() makes concurrent founders collide instead of double-seeding.
    await this.seasons.doc(season.id).create(season);

    const writer = this.db.bulkWriter();
    for (const turf of CITY_TURFS) {
      const state: TurfState = {
        ...turf,
        assignedCrew: [],
        buildings: [],
        claimedAt: null,
        defenseDamage: 0,
        incomeAccruedAt: nowIso,
        ownerColor: null,
        ownerName: null,
        ownerUid: null,
        shieldUntil: null,
        storedIncome: 0,
        updatedAt: nowIso,
      };
      void writer.create(this.turfsRef(season.id).doc(turf.id), state);
    }
    await writer.close();

    return season;
  }

  turfsRef(seasonId: string): CollectionReference {
    return this.seasons.doc(seasonId).collection("turfs");
  }

  seasonRef(seasonId: string): DocumentReference {
    return this.seasons.doc(seasonId);
  }

  private get seasons(): CollectionReference {
    return this.db.collection("seasons");
  }
}
