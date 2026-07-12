import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import {
  BuildingInstance,
  INCOME_STORAGE_HOURS,
  MAX_BUILDING_LEVEL,
  RAID_CHANCE_PER_DAY,
  RAID_HEAT_THRESHOLD,
  accrueStoredIncome,
  buildingRepairCost,
  buildingUpgradeCost,
} from "../../../shared/building";
import { buildingDefinition } from "../../../shared/buildingCatalog";
import {
  CREW_PRISON_HOURS,
  CrewMember,
  normalizeCrewMember,
} from "../../../shared/crew";
import { DISTRICTS } from "../../../shared/district";
import { JobOffer, Mission } from "../../../shared/job";
import {
  MAX_HEAT,
  PLAYER_RANKS,
  Player,
  normalizePlayer,
} from "../../../shared/player";
import { Season } from "../../../shared/season";
import {
  DISTRICT_MAJORITY_INCOME_FACTOR,
  TERRITORY_UNLOCK_RANK,
  TurfState,
  canReachTurf,
  controlsDistrictMajority,
  familyNameKey,
  turfDefense,
  turfUpkeepPerDay,
} from "../../../shared/territory";
import { JobCalculatorService } from "../engine/JobCalculatorService";
import { clamp } from "../engine/math";
import { PlayerContextService } from "../engine/PlayerContextService";
import { HttpError } from "../middleware/errorHandler";
import { BuildingService } from "./BuildingService";
import { EffectsService } from "./EffectsService";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";
import { MissionService } from "./MissionService";
import { MissionTemplateService } from "./MissionTemplateService";
import { NotificationService } from "./NotificationService";
import { SeasonService } from "./SeasonService";
import { WorldEventService } from "./WorldEventService";

const TAKEOVER_TEMPLATE_ID = "turf-takeover";

export type MapFamily = {
  color: string;
  name: string;
  turfCount: number;
  uid: string;
};

export type MapView = {
  families: MapFamily[];
  season: Season;
  turfs: TurfState[];
};

/**
 * The city map: turf ownership, the claim pipeline (which runs takeovers
 * through the mission engine), rackets standing on turf, defenders, and
 * the collection round that settles income, upkeep, heat, and raids.
 */
export class TerritoryService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly seasons: SeasonService,
    private readonly missions: MissionService,
    private readonly buildings: BuildingService,
    private readonly effects: EffectsService,
    private readonly templates: MissionTemplateService,
    private readonly engine: EngineConfigService,
    private readonly notifications: NotificationService,
    private readonly worldEvents: WorldEventService,
  ) {
    this.db = firebase.firestore;
  }

  async mapView(): Promise<MapView> {
    const season = await this.seasons.getActiveSeason();
    const snapshot = await this.seasons.turfsRef(season.id).get();
    const turfs = snapshot.docs.map((doc) => doc.data() as TurfState);

    const familiesByUid = new Map<string, MapFamily>();
    for (const turf of turfs) {
      if (!turf.ownerUid) {
        continue;
      }
      const family = familiesByUid.get(turf.ownerUid) ?? {
        color: turf.ownerColor ?? "#888888",
        name: turf.ownerName ?? "Unknown family",
        turfCount: 0,
        uid: turf.ownerUid,
      };
      family.turfCount += 1;
      familiesByUid.set(turf.ownerUid, family);
    }

    return {
      families: [...familiesByUid.values()].sort(
        (a, b) => b.turfCount - a.turfCount,
      ),
      season,
      turfs,
    };
  }

  /** Names the mafia and picks its color — the moment a player enters
   * the map game. Family names are unique citywide. */
  async foundFamily(uid: string, color: string, name: string): Promise<Player> {
    const playerRef = this.db.collection("players").doc(uid);
    const nameKey = familyNameKey(name);
    const sameNameQuery = this.db
      .collection("players")
      .where("family.nameKey", "==", nameKey)
      .limit(1);

    return this.db.runTransaction(async (tx) => {
      const [snapshot, sameName] = await Promise.all([
        tx.get(playerRef),
        tx.get(sameNameQuery),
      ]);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }
      if (!sameName.empty) {
        throw new HttpError(409, "A family already runs under that name.");
      }

      const player = normalizePlayer(snapshot.data() as Player);
      this.assertUnlocked(player);
      if (player.family) {
        throw new HttpError(409, "Your family already flies its colors.");
      }

      const nowIso = new Date().toISOString();
      const updated: Player = {
        ...player,
        family: { color, foundedAt: nowIso, name: name.trim(), nameKey },
        updatedAt: nowIso,
      };
      tx.set(playerRef, updated);
      return updated;
    });
  }

  /**
   * Moving on an unclaimed block: builds a takeover offer whose difficulty
   * IS the turf's defense and hands it to the mission engine. The flag is
   * planted when the mission resolves well.
   */
  async claimTurf(
    player: Player,
    turfId: string,
    crewIds: string[],
  ): Promise<Mission> {
    this.assertUnlocked(player);
    if (!player.family) {
      throw new HttpError(403, "Found your family before you paint the map.");
    }

    const season = await this.seasons.getActiveSeason();
    const turfSnap = await this.seasons.turfsRef(season.id).doc(turfId).get();
    if (!turfSnap.exists) {
      throw new HttpError(404, "That turf doesn't exist.");
    }

    const turf = turfSnap.data() as TurfState;
    if (turf.ownerUid !== null) {
      throw new HttpError(409, "That block already flies a flag.");
    }
    if (turf.landmarkId) {
      throw new HttpError(
        409,
        "Landmarks aren't claimed with a handshake — they're taken by force.",
      );
    }

    const owned = await this.ownedTurfs(season.id, player.id);
    if (owned.length > 0 && !canReachTurf(turf, owned)) {
      throw new HttpError(
        409,
        "Too far from your ground. Expand block by block, or through the district.",
      );
    }

    const template = this.templates.find(TAKEOVER_TEMPLATE_ID);
    if (!template) {
      throw new HttpError(500, "Takeover mission template is missing.");
    }

    const context = PlayerContextService.fromPlayer(player);
    const calculations = JobCalculatorService.calculate(
      context,
      template,
      this.engine.config,
    );
    const difficulty = clamp(Math.round(turfDefense(turf, 0)), 1, 100);
    const seedIndex =
      createHash("sha256").update(`${turfId}:${player.id}`).digest()[0]! %
      template.storySeeds.length;
    const storySeed = template.storySeeds[seedIndex]!;

    const offer: JobOffer = {
      difficulty,
      district: DISTRICTS[turf.district].label,
      heatIncrease: clamp(
        template.heat.base +
          Math.floor(difficulty * template.heat.perDifficulty),
        1,
        template.heat.max,
      ),
      id: randomUUID(),
      rewardMax: calculations.rewardMax,
      rewardMin: calculations.rewardMin,
      staminaCost: JobCalculatorService.staminaCost(
        template,
        difficulty,
        this.engine.config,
      ),
      storySeed: { ...storySeed, location: turf.name },
      templateId: template.id,
      type: template.type,
    };

    return this.missions.acceptTakeover(
      player,
      offer,
      template,
      { seasonId: season.id, turfId, turfName: turf.name },
      crewIds,
    );
  }

  /** Posts crew as defenders on an owned turf (replaces current posting). */
  async assignDefense(
    uid: string,
    turfId: string,
    crewIds: string[],
  ): Promise<TurfState> {
    const season = await this.seasons.getActiveSeason();
    const turfRef = this.seasons.turfsRef(season.id).doc(turfId);

    return this.db.runTransaction(async (tx) => {
      const [turfSnap, crewSnap] = await Promise.all([
        tx.get(turfRef),
        tx.get(this.crewRef(uid)),
      ]);
      const turf = this.requireOwnedTurf(turfSnap, uid);
      const crewById = this.indexCrew(crewSnap.docs);
      const nowIso = new Date().toISOString();

      for (const id of crewIds) {
        const member = crewById.get(id);
        if (!member) {
          throw new HttpError(404, `No such crew member: ${id}.`);
        }
        const alreadyHere =
          member.status === "assigned_turf" && member.assignment === turfId;
        if (member.status !== "idle" && !alreadyHere) {
          throw new HttpError(409, `${member.name} isn't free to stand guard.`);
        }
      }

      for (const id of turf.assignedCrew.filter((c) => !crewIds.includes(c))) {
        const member = crewById.get(id);
        if (member) {
          tx.set(this.crewRef(uid).doc(id), {
            ...member,
            assignment: null,
            status: "idle",
            updatedAt: nowIso,
          });
        }
      }
      for (const id of crewIds) {
        tx.set(this.crewRef(uid).doc(id), {
          ...crewById.get(id)!,
          assignment: turfId,
          status: "assigned_turf",
          updatedAt: nowIso,
        });
      }

      const updated: TurfState = {
        ...turf,
        assignedCrew: crewIds,
        updatedAt: nowIso,
      };
      tx.set(turfRef, updated);
      return updated;
    });
  }

  /** Puts a racket up on an owned turf's building slot. */
  async buildRacket(
    uid: string,
    turfId: string,
    definitionId: string,
  ): Promise<TurfState> {
    const definition = buildingDefinition(definitionId);
    if (!definition || definition.class !== "racket") {
      throw new HttpError(404, "That isn't something you can build on turf.");
    }

    const season = await this.seasons.getActiveSeason();
    const turfRef = this.seasons.turfsRef(season.id).doc(turfId);
    const playerRef = this.db.collection("players").doc(uid);

    const result = await this.db.runTransaction(async (tx) => {
      const [turfSnap, playerSnap] = await Promise.all([
        tx.get(turfRef),
        tx.get(playerRef),
      ]);
      const turf = this.requireOwnedTurf(turfSnap, uid);
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }
      const player = normalizePlayer(playerSnap.data() as Player);

      if (
        PLAYER_RANKS.indexOf(player.rank) <
        PLAYER_RANKS.indexOf(definition.rankRequirement)
      ) {
        throw new HttpError(403, "You're not established enough to run that.");
      }
      if (turf.buildings.length >= turf.buildingSlots) {
        throw new HttpError(409, "No room left on that block.");
      }
      if (player.resources.cash < definition.cost) {
        throw new HttpError(402, "You can't cover the construction.");
      }

      const nowIso = new Date().toISOString();
      const instance: BuildingInstance = {
        createdAt: nowIso,
        damaged: false,
        definitionId,
        id: randomUUID(),
        incomeAccruedAt: nowIso,
        level: 1,
        staff: [],
        storedIncome: 0,
        updatedAt: nowIso,
      };

      const updated: TurfState = {
        ...turf,
        buildings: [...turf.buildings, instance],
        updatedAt: nowIso,
      };
      tx.set(turfRef, updated);
      tx.set(playerRef, {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash - definition.cost,
        },
        updatedAt: nowIso,
      });
      return updated;
    });

    this.effects.invalidate(uid);
    return result;
  }

  async upgradeRacket(
    uid: string,
    turfId: string,
    buildingId: string,
  ): Promise<TurfState> {
    return this.mutateRacket(uid, turfId, buildingId, (building, player) => {
      const definition = buildingDefinition(building.definitionId);
      if (!definition) {
        throw new HttpError(500, "Unknown building definition.");
      }
      if (building.level >= MAX_BUILDING_LEVEL) {
        throw new HttpError(400, "It's already the best on the block.");
      }
      if (building.damaged) {
        throw new HttpError(409, "Repair it before you expand it.");
      }

      const cost = buildingUpgradeCost(definition, building.level + 1);
      if (player.resources.cash < cost) {
        throw new HttpError(402, "You can't cover the works.");
      }

      return {
        building: { ...building, level: building.level + 1 },
        cashDelta: -cost,
      };
    });
  }

  async repairRacket(
    uid: string,
    turfId: string,
    buildingId: string,
  ): Promise<TurfState> {
    const result = await this.mutateRacket(
      uid,
      turfId,
      buildingId,
      (building, player) => {
        if (!building.damaged) {
          throw new HttpError(400, "Nothing needs fixing.");
        }
        const definition = buildingDefinition(building.definitionId);
        if (!definition) {
          throw new HttpError(500, "Unknown building definition.");
        }

        const cost = buildingRepairCost(definition, building.level);
        if (player.resources.cash < cost) {
          throw new HttpError(402, "You can't cover the repairs.");
        }

        return {
          building: {
            ...building,
            damaged: false,
            incomeAccruedAt: new Date().toISOString(),
          },
          cashDelta: -cost,
        };
      },
    );

    this.effects.invalidate(uid);
    return result;
  }

  /** Staffs a racket standing on an owned turf. */
  async staffRacket(
    uid: string,
    turfId: string,
    buildingId: string,
    crewIds: string[],
  ): Promise<TurfState> {
    const season = await this.seasons.getActiveSeason();
    const turfRef = this.seasons.turfsRef(season.id).doc(turfId);

    return this.db.runTransaction(async (tx) => {
      const [turfSnap, crewSnap] = await Promise.all([
        tx.get(turfRef),
        tx.get(this.crewRef(uid)),
      ]);
      const turf = this.requireOwnedTurf(turfSnap, uid);
      const crewById = this.indexCrew(crewSnap.docs);

      const index = turf.buildings.findIndex((b) => b.id === buildingId);
      if (index === -1) {
        throw new HttpError(404, "No such building on that turf.");
      }
      const building = turf.buildings[index]!;
      const definition = buildingDefinition(building.definitionId);
      if (!definition) {
        throw new HttpError(500, "Unknown building definition.");
      }
      if (crewIds.length > definition.staffSlots) {
        throw new HttpError(
          400,
          `${definition.name} has ${definition.staffSlots} position${definition.staffSlots === 1 ? "" : "s"}.`,
        );
      }

      const nowIso = new Date().toISOString();
      for (const id of crewIds) {
        const member = crewById.get(id);
        if (!member) {
          throw new HttpError(404, `No such crew member: ${id}.`);
        }
        const alreadyHere =
          member.status === "assigned_building" &&
          member.assignment === buildingId;
        if (member.status !== "idle" && !alreadyHere) {
          throw new HttpError(409, `${member.name} isn't free to work a floor.`);
        }
      }

      for (const id of building.staff.filter((s) => !crewIds.includes(s))) {
        const member = crewById.get(id);
        if (member) {
          tx.set(this.crewRef(uid).doc(id), {
            ...member,
            assignment: null,
            status: "idle",
            updatedAt: nowIso,
          });
        }
      }
      for (const id of crewIds) {
        tx.set(this.crewRef(uid).doc(id), {
          ...crewById.get(id)!,
          assignment: buildingId,
          status: "assigned_building",
          updatedAt: nowIso,
        });
      }

      const buildings = [...turf.buildings];
      buildings[index] = { ...building, staff: crewIds, updatedAt: nowIso };
      const updated: TurfState = { ...turf, buildings, updatedAt: nowIso };
      tx.set(turfRef, updated);
      return updated;
    });
  }

  /**
   * The territory collection round: every owned turf's till (base district
   * income, majority-boosted) plus every racket till, minus upkeep — heat
   * settles with it, and a family running too hot risks the precinct
   * kicking in the door of its loudest racket.
   */
  async collectTurfs(
    uid: string,
  ): Promise<{ collected: number; raided: string | null; upkeep: number }> {
    const season = await this.seasons.getActiveSeason();
    const effects = await this.effects.forPlayer(uid);
    const storageHours = INCOME_STORAGE_HOURS + effects.incomeStorageBonusHours;

    const outcome = await this.db.runTransaction(async (tx) => {
      const playerRef = this.db.collection("players").doc(uid);
      const [turfSnap, playerSnap, crewSnap] = await Promise.all([
        tx.get(this.seasons.turfsRef(season.id).where("ownerUid", "==", uid)),
        tx.get(playerRef),
        tx.get(this.crewRef(uid)),
      ]);

      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }
      if (turfSnap.empty) {
        return { collected: 0, raided: null as string | null, upkeep: 0 };
      }

      const player = normalizePlayer(playerSnap.data() as Player);
      const crewById = this.indexCrew(crewSnap.docs);
      const nowIso = new Date().toISOString();
      const turfs = turfSnap.docs.map((doc) => doc.data() as TurfState);

      const ownedByDistrict = new Map<string, number>();
      for (const turf of turfs) {
        ownedByDistrict.set(
          turf.district,
          (ownedByDistrict.get(turf.district) ?? 0) + 1,
        );
      }

      const upkeepPerDay =
        turfUpkeepPerDay(turfs.length) * effects.upkeepFactor;
      let gross = 0;
      let upkeep = 0;
      let heatShift = 0;

      const settledTurfs = turfs.map((turf) => {
        const majority = controlsDistrictMajority(
          ownedByDistrict.get(turf.district) ?? 0,
          10,
        );
        const landmark = turf.landmarkId
          ? buildingDefinition(turf.landmarkId)
          : null;
        const baseRate =
          (DISTRICTS[turf.district].turfIncomePerHour +
            (landmark?.incomePerHour ?? 0)) *
          (majority ? DISTRICT_MAJORITY_INCOME_FACTOR : 1);

        const hours = Math.min(
          Math.max(
            0,
            (Date.parse(nowIso) - Date.parse(turf.incomeAccruedAt)) / 3_600_000,
          ),
          storageHours,
        );

        const till = accrueStoredIncome(
          turf.storedIncome,
          baseRate,
          turf.incomeAccruedAt,
          nowIso,
          storageHours,
        );
        gross += Math.floor(till);
        upkeep += (upkeepPerDay / turfs.length) * hours;

        const buildings = turf.buildings.map((building) => {
          const settled = this.buildings.settleInstance(
            building,
            crewById,
            nowIso,
            storageHours,
          );
          const amount = Math.floor(settled.instance.storedIncome);
          gross += amount;
          const definition = buildingDefinition(building.definitionId);
          if (definition && settled.rate > 0 && amount > 0) {
            heatShift += definition.heatPerDay * (amount / settled.rate);
          }
          return {
            ...settled.instance,
            storedIncome: settled.instance.storedIncome - amount,
          };
        });

        return {
          ...turf,
          buildings,
          incomeAccruedAt: nowIso,
          storedIncome: till - Math.floor(till),
          updatedAt: nowIso,
        };
      });

      const upkeepDue = Math.round(upkeep);
      const heatAfter = clamp(
        Math.round(player.resources.heat + heatShift),
        0,
        MAX_HEAT,
      );

      // The precinct kicks a door when a family collects while running hot.
      let raided: string | null = null;
      if (heatAfter >= RAID_HEAT_THRESHOLD) {
        const roll =
          createHash("sha256")
            .update(`${uid}:${nowIso.slice(0, 13)}:raid`)
            .digest()
            .readUInt32BE(0) % 100;
        if (roll < RAID_CHANCE_PER_DAY * 100) {
          const raid = this.applyRaid(settledTurfs, crewById, nowIso);
          raided = raid.name;
          for (const member of raid.arrested) {
            tx.set(this.crewRef(uid).doc(member.id), member);
          }
        }
      }

      for (let i = 0; i < settledTurfs.length; i += 1) {
        tx.set(turfSnap.docs[i]!.ref, settledTurfs[i]!);
      }

      const net = Math.max(0, gross - upkeepDue);
      tx.set(playerRef, {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash + net,
          heat: heatAfter,
        },
        updatedAt: nowIso,
      });

      return { collected: net, raided, upkeep: upkeepDue };
    });

    if (outcome.raided) {
      await Promise.all([
        this.notifications.push(
          uid,
          "building_raided",
          "The precinct kicked in a door",
          `Police raided your ${outcome.raided}. The till is gone and the place is dark until you repair it.`,
        ),
        this.worldEvents.emit(
          season.id,
          "building_raided",
          `Police raided a ${outcome.raided} — the owners ran too hot for too long.`,
        ),
      ]);
    }

    return outcome;
  }

  private async ownedTurfs(seasonId: string, uid: string): Promise<TurfState[]> {
    const snapshot = await this.seasons
      .turfsRef(seasonId)
      .where("ownerUid", "==", uid)
      .get();
    return snapshot.docs.map((doc) => doc.data() as TurfState);
  }

  /** Damages the loudest racket in place; staff are taken with the till. */
  private applyRaid(
    turfs: TurfState[],
    crewById: Map<string, CrewMember>,
    nowIso: string,
  ): { arrested: CrewMember[]; name: string | null } {
    let loudest: { building: BuildingInstance; heat: number } | null = null;

    for (const turf of turfs) {
      for (const building of turf.buildings) {
        const definition = buildingDefinition(building.definitionId);
        if (!definition || building.damaged || definition.heatPerDay <= 0) {
          continue;
        }
        if (!loudest || definition.heatPerDay > loudest.heat) {
          loudest = { building, heat: definition.heatPerDay };
        }
      }
    }

    if (!loudest) {
      return { arrested: [], name: null };
    }

    loudest.building.damaged = true;
    loudest.building.storedIncome = 0;
    loudest.building.updatedAt = nowIso;

    const arrested: CrewMember[] = [];
    for (const id of loudest.building.staff) {
      const member = crewById.get(id);
      if (member && member.status === "assigned_building") {
        arrested.push({
          ...member,
          assignment: null,
          busyUntil: new Date(
            Date.parse(nowIso) + CREW_PRISON_HOURS * 3_600_000,
          ).toISOString(),
          confiscatedLoadout: member.loadout,
          loadout: {},
          status: "imprisoned",
          updatedAt: nowIso,
        });
      }
    }
    loudest.building.staff = [];

    return {
      arrested,
      name: buildingDefinition(loudest.building.definitionId)?.name ?? null,
    };
  }

  private requireOwnedTurf(
    snapshot: FirebaseFirestore.DocumentSnapshot,
    uid: string,
  ): TurfState {
    if (!snapshot.exists) {
      throw new HttpError(404, "That turf doesn't exist.");
    }
    const turf = snapshot.data() as TurfState;
    if (turf.ownerUid !== uid) {
      throw new HttpError(403, "That block doesn't fly your flag.");
    }
    return turf;
  }

  private mutateRacket(
    uid: string,
    turfId: string,
    buildingId: string,
    change: (
      building: BuildingInstance,
      player: Player,
    ) => { building: BuildingInstance; cashDelta: number },
  ): Promise<TurfState> {
    return this.seasons.getActiveSeason().then((season) => {
      const turfRef = this.seasons.turfsRef(season.id).doc(turfId);
      const playerRef = this.db.collection("players").doc(uid);

      return this.db.runTransaction(async (tx) => {
        const [turfSnap, playerSnap] = await Promise.all([
          tx.get(turfRef),
          tx.get(playerRef),
        ]);
        const turf = this.requireOwnedTurf(turfSnap, uid);
        if (!playerSnap.exists) {
          throw new HttpError(404, "Player not found.");
        }

        const index = turf.buildings.findIndex((b) => b.id === buildingId);
        if (index === -1) {
          throw new HttpError(404, "No such building on that turf.");
        }

        const nowIso = new Date().toISOString();
        const player = normalizePlayer(playerSnap.data() as Player);
        const result = change(turf.buildings[index]!, player);

        const buildings = [...turf.buildings];
        buildings[index] = { ...result.building, updatedAt: nowIso };
        const updated: TurfState = { ...turf, buildings, updatedAt: nowIso };

        tx.set(turfRef, updated);
        tx.set(playerRef, {
          ...player,
          resources: {
            ...player.resources,
            cash: player.resources.cash + result.cashDelta,
          },
          updatedAt: nowIso,
        });
        return updated;
      });
    });
  }

  private indexCrew(
    docs: FirebaseFirestore.QueryDocumentSnapshot[],
  ): Map<string, CrewMember> {
    return new Map(
      docs.map((doc) => {
        const member = normalizeCrewMember(doc.data() as CrewMember);
        return [member.id, member];
      }),
    );
  }

  private assertUnlocked(player: Player): void {
    if (
      PLAYER_RANKS.indexOf(player.rank) <
      PLAYER_RANKS.indexOf(TERRITORY_UNLOCK_RANK)
    ) {
      throw new HttpError(403, "The map opens when you make local boss.");
    }
  }

  private crewRef(uid: string): CollectionReference {
    return this.db.collection("players").doc(uid).collection("crew");
  }
}
