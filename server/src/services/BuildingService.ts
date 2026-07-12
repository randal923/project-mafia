import {
  CollectionReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import {
  BuildingInstance,
  INCOME_STORAGE_HOURS,
  MAX_BUILDING_LEVEL,
  PERSONAL_BUILDING_SLOTS_BY_RANK,
  StaffingInput,
  accrueStoredIncome,
  buildingIncomeRate,
  buildingRepairCost,
  buildingUpgradeCost,
} from "../../../shared/building";
import {
  BUILDING_CATALOG,
  buildingDefinition,
} from "../../../shared/buildingCatalog";
import {
  CrewMember,
  crewTraitModifiers,
  normalizeCrewMember,
} from "../../../shared/crew";
import {
  MAX_HEAT,
  PLAYER_RANKS,
  Player,
  normalizePlayer,
} from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { EffectsService } from "./EffectsService";
import { FirebaseService } from "./FirebaseService";

export type HoldingsView = {
  buildings: Array<BuildingInstance & { incomeRate: number }>;
  player: Player;
  /** Personal slots total at the player's rank. */
  slots: number;
};

/**
 * Class A personal holdings: the safe, off-map part of the empire. Income
 * accrues lazily against each building's own clock and caps at the
 * storage window; heat (rackets run hot, fronts launder) lands when the
 * till is emptied. Turf rackets reuse the same math via TerritoryService.
 */
export class BuildingService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly effects: EffectsService,
  ) {
    this.db = firebase.firestore;
  }

  /** Roster of holdings with income settled up to now. */
  async listHoldings(uid: string): Promise<HoldingsView> {
    const storageHours = await this.storageHours(uid);

    return this.db.runTransaction(async (tx) => {
      const { player, buildings, docs, crewById } = await this.readAll(tx, uid);
      const nowIso = new Date().toISOString();
      const settled: Array<BuildingInstance & { incomeRate: number }> = [];

      buildings.forEach((building, i) => {
        const { instance, rate } = this.settleInstance(
          building,
          crewById,
          nowIso,
          storageHours,
        );
        if (instance.storedIncome !== building.storedIncome) {
          tx.set(docs[i]!.ref, instance);
        }
        settled.push({ ...instance, incomeRate: rate });
      });

      return {
        buildings: settled,
        player,
        slots: PERSONAL_BUILDING_SLOTS_BY_RANK[player.rank],
      };
    });
  }

  async buyPersonal(uid: string, definitionId: string): Promise<HoldingsView> {
    const definition = buildingDefinition(definitionId);
    if (!definition || definition.class !== "personal") {
      throw new HttpError(404, "No such property is on the market.");
    }

    await this.db.runTransaction(async (tx) => {
      const { player, buildings } = await this.readAll(tx, uid);

      const rankIndex = PLAYER_RANKS.indexOf(player.rank);
      if (rankIndex < PLAYER_RANKS.indexOf(definition.rankRequirement)) {
        throw new HttpError(403, "You're not established enough for that deed.");
      }
      const slots = PERSONAL_BUILDING_SLOTS_BY_RANK[player.rank];
      if (buildings.length >= slots) {
        throw new HttpError(
          409,
          `Your rank holds ${slots} propert${slots === 1 ? "y" : "ies"}. Climb higher.`,
        );
      }
      if (buildings.some((b) => b.definitionId === definitionId)) {
        throw new HttpError(409, "You already run one of those.");
      }
      if (player.resources.cash < definition.cost) {
        throw new HttpError(402, "You can't cover the purchase.");
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

      tx.set(this.buildingsRef(uid).doc(instance.id), instance);
      tx.set(this.players.doc(uid), {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash - definition.cost,
        },
        updatedAt: nowIso,
      });
    });

    this.effects.invalidate(uid);
    return this.listHoldings(uid);
  }

  async upgradePersonal(uid: string, buildingId: string): Promise<HoldingsView> {
    await this.mutateBuilding(uid, buildingId, (building, player) => {
      const definition = this.requireDefinition(building);
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

    return this.listHoldings(uid);
  }

  async repairPersonal(uid: string, buildingId: string): Promise<HoldingsView> {
    await this.mutateBuilding(uid, buildingId, (building, player) => {
      if (!building.damaged) {
        throw new HttpError(400, "Nothing needs fixing.");
      }

      const cost = buildingRepairCost(
        this.requireDefinition(building),
        building.level,
      );
      if (player.resources.cash < cost) {
        throw new HttpError(402, "You can't cover the repairs.");
      }

      const nowIso = new Date().toISOString();
      return {
        building: {
          ...building,
          damaged: false,
          incomeAccruedAt: nowIso,
        },
        cashDelta: -cost,
      };
    });

    this.effects.invalidate(uid);
    return this.listHoldings(uid);
  }

  /** Assigns the given crew (replacing current staff) to a holding. */
  async staffPersonal(
    uid: string,
    buildingId: string,
    crewIds: string[],
  ): Promise<HoldingsView> {
    const storageHours = await this.storageHours(uid);

    await this.db.runTransaction(async (tx) => {
      const { buildings, docs, crewById } = await this.readAll(tx, uid);
      const index = buildings.findIndex((b) => b.id === buildingId);
      if (index === -1) {
        throw new HttpError(404, "You don't own that building.");
      }

      const building = buildings[index]!;
      const definition = this.requireDefinition(building);
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

      // Income earned under the OLD staffing settles before the change.
      const { instance } = this.settleInstance(
        building,
        crewById,
        nowIso,
        storageHours,
      );

      // Outgoing staff go idle; incoming staff clock in.
      for (const id of instance.staff.filter((s) => !crewIds.includes(s))) {
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
        const member = crewById.get(id)!;
        tx.set(this.crewRef(uid).doc(id), {
          ...member,
          assignment: buildingId,
          status: "assigned_building",
          updatedAt: nowIso,
        });
      }

      tx.set(docs[index]!.ref, {
        ...instance,
        staff: crewIds,
        updatedAt: nowIso,
      });
    });

    return this.listHoldings(uid);
  }

  /** Empties every till into the player's pocket. Heat settles with it. */
  async collectAll(uid: string): Promise<HoldingsView & { collected: number }> {
    const storageHours = await this.storageHours(uid);

    const collected = await this.db.runTransaction(async (tx) => {
      const { player, buildings, docs, crewById } = await this.readAll(tx, uid);
      const nowIso = new Date().toISOString();
      let take = 0;
      let heatShift = 0;

      buildings.forEach((building, i) => {
        const definition = buildingDefinition(building.definitionId);
        if (!definition) {
          return;
        }
        const { instance, rate } = this.settleInstance(
          building,
          crewById,
          nowIso,
          storageHours,
        );
        const amount = Math.floor(instance.storedIncome);
        if (amount <= 0 && instance.storedIncome === building.storedIncome) {
          return;
        }

        // Heat lands in proportion to the production time being banked.
        if (rate > 0 && amount > 0) {
          heatShift += definition.heatPerDay * (amount / rate);
        }

        take += amount;
        tx.set(docs[i]!.ref, {
          ...instance,
          storedIncome: instance.storedIncome - amount,
          updatedAt: nowIso,
        });
      });

      if (take > 0 || heatShift !== 0) {
        tx.set(this.players.doc(uid), {
          ...player,
          resources: {
            ...player.resources,
            cash: player.resources.cash + take,
            heat: Math.min(
              MAX_HEAT,
              Math.max(0, Math.round(player.resources.heat + heatShift)),
            ),
          },
          updatedAt: nowIso,
        });
      }

      return take;
    });

    const holdings = await this.listHoldings(uid);
    return { ...holdings, collected };
  }

  /** The purchasable Class A catalog, for the empire page. */
  catalog() {
    return BUILDING_CATALOG.filter((def) => def.class === "personal");
  }

  /**
   * Accrues income up to `nowIso` under current staffing. Shared shape:
   * turf rackets settle through the same helper via TerritoryService.
   */
  settleInstance(
    building: BuildingInstance,
    crewById: Map<string, CrewMember>,
    nowIso: string,
    storageHours: number,
  ): { instance: BuildingInstance; rate: number } {
    const definition = buildingDefinition(building.definitionId);
    if (!definition) {
      return { instance: building, rate: 0 };
    }

    const staff: StaffingInput[] = building.staff
      .map((id) => crewById.get(id))
      .filter((member): member is CrewMember => Boolean(member))
      .map((member) => ({
        archetype: member.archetype,
        incomeFactor: crewTraitModifiers(member.traits).incomeFactor ?? 1,
      }));

    const rate = buildingIncomeRate(
      definition,
      building.level,
      staff,
      building.damaged,
    );

    return {
      instance: {
        ...building,
        incomeAccruedAt: nowIso,
        storedIncome: accrueStoredIncome(
          building.storedIncome,
          rate,
          building.incomeAccruedAt,
          nowIso,
          storageHours,
        ),
      },
      rate,
    };
  }

  buildingsRef(uid: string): CollectionReference {
    return this.players.doc(uid).collection("buildings");
  }

  private async storageHours(uid: string): Promise<number> {
    const effects = await this.effects.forPlayer(uid);
    return INCOME_STORAGE_HOURS + effects.incomeStorageBonusHours;
  }

  private async readAll(tx: Transaction, uid: string) {
    const [playerSnap, buildingsSnap, crewSnap] = await Promise.all([
      tx.get(this.players.doc(uid)),
      tx.get(this.buildingsRef(uid)),
      tx.get(this.crewRef(uid)),
    ]);

    if (!playerSnap.exists) {
      throw new HttpError(404, "Player not found.");
    }

    const crewById = new Map<string, CrewMember>(
      crewSnap.docs.map((doc) => {
        const member = normalizeCrewMember(doc.data() as CrewMember);
        return [member.id, member];
      }),
    );

    return {
      buildings: buildingsSnap.docs.map((doc) => doc.data() as BuildingInstance),
      crewById,
      docs: buildingsSnap.docs,
      player: normalizePlayer(playerSnap.data() as Player),
    };
  }

  private async mutateBuilding(
    uid: string,
    buildingId: string,
    change: (
      building: BuildingInstance,
      player: Player,
    ) => { building: BuildingInstance; cashDelta: number },
  ): Promise<void> {
    const buildingRef = this.buildingsRef(uid).doc(buildingId);
    const playerRef = this.players.doc(uid);

    await this.db.runTransaction(async (tx) => {
      const [buildingSnap, playerSnap] = await Promise.all([
        tx.get(buildingRef),
        tx.get(playerRef),
      ]);

      if (!buildingSnap.exists) {
        throw new HttpError(404, "You don't own that building.");
      }
      if (!playerSnap.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const nowIso = new Date().toISOString();
      const player = normalizePlayer(playerSnap.data() as Player);
      const result = change(buildingSnap.data() as BuildingInstance, player);

      tx.set(buildingRef, { ...result.building, updatedAt: nowIso });
      tx.set(playerRef, {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash + result.cashDelta,
        },
        updatedAt: nowIso,
      });
    });
  }

  private requireDefinition(building: BuildingInstance) {
    const definition = buildingDefinition(building.definitionId);
    if (!definition) {
      throw new HttpError(500, "Unknown building definition.");
    }
    return definition;
  }

  private get players(): CollectionReference {
    return this.db.collection("players");
  }

  private crewRef(uid: string): CollectionReference {
    return this.players.doc(uid).collection("crew");
  }
}
