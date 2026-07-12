import {
  CollectionReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import {
  CREW_TRAINING_HOURS,
  CREW_TRAINING_SKILL_GAIN,
  CrewLoadout,
  CrewMember,
  CrewSlotId,
  LOYALTY_GAIN_PER_PAID_DAY,
  LOYALTY_LOSS_PER_UNPAID_DAY,
  LOYALTY_RAT_THRESHOLD,
  MAX_CREW_LOYALTY,
  MAX_CREW_SKILL_LEVEL,
  MAX_UNPAID_WAGE_DAYS,
  RAT_HEAT_SPIKE,
  crewBribeCost,
  crewTraitModifiers,
  crewTrainingCost,
  crewWage,
  isCrewSlot,
  normalizeCrewMember,
} from "../../../shared/crew";
import {
  EquipmentSlotId,
  MAX_HEAT,
  Player,
  normalizePlayer,
} from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { EffectsService } from "./EffectsService";
import { FirebaseService } from "./FirebaseService";
import { NotificationService } from "./NotificationService";

/** Chance per unpaid game day that a bitter, broke member turns rat. */
const RAT_CHANCE_PERCENT = 25;

export type CrewSettleResult = {
  crew: CrewMember[];
  player: Player;
};

/**
 * The roster: wages, loyalty, training, gear, and the slow consequences
 * of not paying people. All time mechanics settle lazily on read, keyed
 * to each member's own wage clock — one game day per real hour, like
 * everything else in the city.
 */
export class CrewService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly notifications: NotificationService,
    private readonly effects: EffectsService,
  ) {
    this.db = firebase.firestore;
  }

  /**
   * Reads the roster with all due consequences applied: recoveries come
   * off the clock, wages come out of the till, and the unpaid drift
   * toward the door. The single entry point for roster reads.
   */
  async settle(uid: string): Promise<CrewSettleResult> {
    const events: Array<() => Promise<void>> = [];
    // Union Hall holders pay their soldiers at the negotiated rate.
    const { wageFactor } = await this.effects.forPlayer(uid);

    const result = await this.db.runTransaction(async (tx) => {
      const playerRef = this.players.doc(uid);
      const [playerSnapshot, crewSnapshot] = await Promise.all([
        tx.get(playerRef),
        tx.get(this.crewRef(uid)),
      ]);

      if (!playerSnapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const nowIso = new Date().toISOString();
      const player = normalizePlayer(playerSnapshot.data() as Player);
      let cash = player.resources.cash;
      let heat = player.resources.heat;
      const survivors: CrewMember[] = [];

      for (const doc of crewSnapshot.docs) {
        const stored = normalizeCrewMember(doc.data() as CrewMember);
        // Members out on a job settle when they come home — a wage tick
        // must never desert someone mid-mission.
        if (stored.status === "on_job") {
          survivors.push(stored);
          continue;
        }
        const member = this.applyRecovery(stored, nowIso, events, uid);
        const settled = this.settleWages(member, cash, nowIso, wageFactor);
        cash = settled.cash;

        if (settled.outcome === "deserted") {
          tx.delete(doc.ref);
          events.push(() =>
            this.notifications.push(
              uid,
              "crew_deserted",
              `${member.name} walked`,
              `Unpaid too long, ${member.name} cleared out — and took the gear on his back with him.`,
              member.id,
            ),
          );
          continue;
        }

        if (settled.outcome === "ratted") {
          tx.delete(doc.ref);
          heat = Math.min(MAX_HEAT, heat + RAT_HEAT_SPIKE);
          events.push(() =>
            this.notifications.push(
              uid,
              "crew_rat",
              `${member.name} talked to the precinct`,
              `Broke and bitter, ${member.name} traded what he knew for walking money. The heat is on.`,
              member.id,
            ),
          );
          continue;
        }

        if (this.changed(stored, settled.member)) {
          tx.set(doc.ref, settled.member);
        }
        survivors.push(settled.member);
      }

      let updatedPlayer = player;
      if (cash !== player.resources.cash || heat !== player.resources.heat) {
        updatedPlayer = {
          ...player,
          resources: { ...player.resources, cash, heat },
          updatedAt: nowIso,
        };
        tx.set(playerRef, updatedPlayer);
      }

      return { crew: survivors, player: updatedPlayer };
    });

    await Promise.all(events.map((emit) => emit()));
    return result;
  }

  /** Fires a member. His gear stays wherever he is — on him. */
  async fire(uid: string, memberId: string): Promise<CrewMember[]> {
    await this.mutateMember(uid, memberId, (member) => {
      if (member.status === "on_job") {
        throw new HttpError(409, "You can't cut someone loose mid-job.");
      }
      return null;
    });

    return (await this.settle(uid)).crew;
  }

  /** Cash in, two real hours on the mats, skill out. */
  async train(uid: string, memberId: string): Promise<CrewSettleResult> {
    await this.mutateMemberWithPlayer(uid, memberId, (member, player) => {
      if (member.status !== "idle") {
        throw new HttpError(409, `${member.name} isn't free to train right now.`);
      }
      if (member.skillLevel >= MAX_CREW_SKILL_LEVEL) {
        throw new HttpError(400, `${member.name} has nothing left to learn.`);
      }

      const cost = crewTrainingCost(member.skillLevel);
      if (player.resources.cash < cost) {
        throw new HttpError(402, "You can't cover the training.");
      }

      const busyUntil = new Date(
        Date.now() + CREW_TRAINING_HOURS * 3_600_000,
      ).toISOString();

      return {
        cashDelta: -cost,
        member: { ...member, busyUntil, status: "training" },
      };
    });

    return this.settle(uid);
  }

  /** Springs an imprisoned member early — gear comes back with him. */
  async bribe(uid: string, memberId: string): Promise<CrewSettleResult> {
    await this.mutateMemberWithPlayer(uid, memberId, (member, player) => {
      if (member.status !== "imprisoned") {
        throw new HttpError(409, `${member.name} isn't in a cell.`);
      }

      const cost = crewBribeCost(member);
      if (player.resources.cash < cost) {
        throw new HttpError(402, "You can't afford this envelope.");
      }

      return {
        cashDelta: -cost,
        member: {
          ...member,
          busyUntil: null,
          confiscatedLoadout: null,
          loadout: { ...member.loadout, ...member.confiscatedLoadout },
          status: "idle",
        },
      };
    });

    return this.settle(uid);
  }

  /** Moves an item from the player's stash onto a member's back. */
  async equip(uid: string, memberId: string, itemId: string): Promise<CrewSettleResult> {
    await this.mutateMemberWithPlayer(uid, memberId, (member, player) => {
      this.assertGearAccess(member);

      const index = player.stash.findIndex((entry) => entry.id === itemId);
      if (index === -1) {
        throw new HttpError(404, "That item isn't in your stash.");
      }

      const item = player.stash[index]!;
      const slot = item.slot as EquipmentSlotId | undefined;
      if (!slot || !isCrewSlot(slot)) {
        throw new HttpError(400, "Crew carry a weapon, a vest, and a belt — nothing else.");
      }
      if (item.consumable) {
        throw new HttpError(400, "Crew don't carry consumables.");
      }
      if (
        item.levelRequirement !== undefined &&
        member.skillLevel < item.levelRequirement
      ) {
        throw new HttpError(
          403,
          `${member.name} needs skill ${item.levelRequirement} to handle that.`,
        );
      }
      const reserved = player.reservedEquipment?.items[item.id] ?? 0;
      if ((item.quantity ?? 1) <= reserved) {
        throw new HttpError(409, "That item is packed for your active job.");
      }

      const stash = this.removeOne(player, index);
      const replaced = member.loadout[slot];
      if (replaced) {
        stash.push(replaced);
      }

      return {
        member: {
          ...member,
          loadout: { ...member.loadout, [slot]: { ...item, quantity: 1 } },
        },
        stash,
      };
    });

    return this.settle(uid);
  }

  /** Takes an item off a member, back into the stash. */
  async unequip(uid: string, memberId: string, slot: CrewSlotId): Promise<CrewSettleResult> {
    await this.mutateMemberWithPlayer(uid, memberId, (member, player) => {
      this.assertGearAccess(member);

      const item = member.loadout[slot];
      if (!item) {
        throw new HttpError(404, "That slot is already empty.");
      }

      const loadout: CrewLoadout = { ...member.loadout };
      delete loadout[slot];

      return {
        member: { ...member, loadout },
        stash: [...player.stash, item],
      };
    });

    return this.settle(uid);
  }

  /** Reads one member inside a transaction-side helper for other services. */
  async requireMembers(
    tx: Transaction,
    uid: string,
    memberIds: string[],
  ): Promise<CrewMember[]> {
    const refs = memberIds.map((id) => this.crewRef(uid).doc(id));
    const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));

    return snapshots.map((snapshot, i) => {
      if (!snapshot.exists) {
        throw new HttpError(404, `No such crew member: ${memberIds[i]}.`);
      }
      return normalizeCrewMember(snapshot.data() as CrewMember);
    });
  }

  crewRef(uid: string): CollectionReference {
    return this.players.doc(uid).collection("crew");
  }

  private get players(): CollectionReference {
    return this.db.collection("players");
  }

  /** injured / imprisoned / training members come off the clock. */
  private applyRecovery(
    member: CrewMember,
    nowIso: string,
    events: Array<() => Promise<void>>,
    uid: string,
  ): CrewMember {
    if (!member.busyUntil || Date.parse(member.busyUntil) > Date.parse(nowIso)) {
      return member;
    }

    if (member.status === "injured") {
      events.push(() =>
        this.notifications.push(
          uid,
          "crew_recovered",
          `${member.name} is back on his feet`,
          `${member.name} shook off his injuries and is ready to work.`,
          member.id,
        ),
      );
      return { ...member, busyUntil: null, status: "idle", updatedAt: nowIso };
    }

    if (member.status === "imprisoned") {
      // Time served: he walks, the precinct keeps the gear.
      events.push(() =>
        this.notifications.push(
          uid,
          "crew_released",
          `${member.name} served his time`,
          `${member.name} walked out of the precinct — without his gear. Evidence lockers are one-way.`,
          member.id,
        ),
      );
      return {
        ...member,
        busyUntil: null,
        confiscatedLoadout: null,
        status: "idle",
        updatedAt: nowIso,
      };
    }

    if (member.status === "training") {
      return {
        ...member,
        busyUntil: null,
        skillLevel: Math.min(
          MAX_CREW_SKILL_LEVEL,
          member.skillLevel + CREW_TRAINING_SKILL_GAIN,
        ),
        status: "idle",
        updatedAt: nowIso,
      };
    }

    return member;
  }

  /**
   * Pays every whole game day owed. What can't be paid turns into loyalty
   * bleed; at zero the member walks, and the truly bitter talk first.
   */
  private settleWages(
    member: CrewMember,
    cash: number,
    nowIso: string,
    wageFactor = 1,
  ): {
    cash: number;
    member: CrewMember;
    outcome: "deserted" | "kept" | "ratted";
  } {
    const hoursOwed =
      (Date.parse(nowIso) - Date.parse(member.wagesSettledAt)) / 3_600_000;
    const daysOwed = Math.min(Math.floor(hoursOwed), MAX_UNPAID_WAGE_DAYS);
    if (daysOwed < 1) {
      return { cash, member, outcome: "kept" };
    }

    const wage = Math.max(
      1,
      Math.round(
        crewWage(member.tier, member.skillLevel, member.traits) * wageFactor,
      ),
    );
    const affordableDays = Math.min(daysOwed, Math.floor(cash / wage));
    const unpaidDays = daysOwed - affordableDays;
    const decayFactor =
      crewTraitModifiers(member.traits).loyaltyDecayFactor ?? 1;

    const loyalty = Math.min(
      MAX_CREW_LOYALTY,
      Math.max(
        0,
        member.loyalty +
          affordableDays * LOYALTY_GAIN_PER_PAID_DAY -
          Math.round(unpaidDays * LOYALTY_LOSS_PER_UNPAID_DAY * decayFactor),
      ),
    );

    const settledAt = new Date(
      Date.parse(member.wagesSettledAt) + daysOwed * 3_600_000,
    ).toISOString();

    const updated: CrewMember = {
      ...member,
      loyalty,
      unpaidSince:
        unpaidDays > 0 ? (member.unpaidSince ?? nowIso) : null,
      updatedAt: nowIso,
      wagesSettledAt: settledAt,
    };

    if (loyalty <= 0) {
      return { cash: cash - affordableDays * wage, member: updated, outcome: "deserted" };
    }

    if (unpaidDays > 0 && loyalty < LOYALTY_RAT_THRESHOLD) {
      // Deterministic per settle window so retries can't reroll fate.
      const roll =
        createHash("sha256")
          .update(`${member.id}:${settledAt}:rat`)
          .digest()
          .readUInt32BE(0) % 100;
      if (roll < RAT_CHANCE_PERCENT) {
        return {
          cash: cash - affordableDays * wage,
          member: updated,
          outcome: "ratted",
        };
      }
    }

    return { cash: cash - affordableDays * wage, member: updated, outcome: "kept" };
  }

  private assertGearAccess(member: CrewMember): void {
    if (member.status === "on_job") {
      throw new HttpError(409, `${member.name} is out on a job.`);
    }
    if (member.status === "imprisoned") {
      throw new HttpError(409, `${member.name}'s gear is in an evidence locker.`);
    }
  }

  private removeOne(player: Player, index: number) {
    const item = player.stash[index]!;
    const owned = item.quantity ?? 1;
    return owned > 1
      ? player.stash.map((entry, i) =>
          i === index ? { ...entry, quantity: owned - 1 } : entry,
        )
      : player.stash.filter((_, i) => i !== index);
  }

  /** Transaction over one member doc only. Return null to delete. */
  private async mutateMember(
    uid: string,
    memberId: string,
    change: (member: CrewMember) => CrewMember | null,
  ): Promise<void> {
    const memberRef = this.crewRef(uid).doc(memberId);

    await this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(memberRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "No such crew member.");
      }

      const updated = change(
        normalizeCrewMember(snapshot.data() as CrewMember),
      );
      if (updated === null) {
        tx.delete(memberRef);
        return;
      }
      tx.set(memberRef, { ...updated, updatedAt: new Date().toISOString() });
    });
  }

  /** Transaction over the player doc + one member doc together. */
  private async mutateMemberWithPlayer(
    uid: string,
    memberId: string,
    change: (
      member: CrewMember,
      player: Player,
    ) => {
      cashDelta?: number;
      member: CrewMember;
      stash?: Player["stash"];
    },
  ): Promise<void> {
    const playerRef = this.players.doc(uid);
    const memberRef = this.crewRef(uid).doc(memberId);

    await this.db.runTransaction(async (tx) => {
      const [playerSnapshot, memberSnapshot] = await Promise.all([
        tx.get(playerRef),
        tx.get(memberRef),
      ]);

      if (!playerSnapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }
      if (!memberSnapshot.exists) {
        throw new HttpError(404, "No such crew member.");
      }

      const nowIso = new Date().toISOString();
      const player = normalizePlayer(playerSnapshot.data() as Player);
      const member = normalizeCrewMember(memberSnapshot.data() as CrewMember);
      const result = change(member, player);

      tx.set(memberRef, { ...result.member, updatedAt: nowIso });

      if (result.cashDelta !== undefined || result.stash !== undefined) {
        tx.set(playerRef, {
          ...player,
          resources: {
            ...player.resources,
            cash: player.resources.cash + (result.cashDelta ?? 0),
          },
          ...(result.stash !== undefined && { stash: result.stash }),
          updatedAt: nowIso,
        });
      }
    });
  }

  private changed(before: CrewMember, after: CrewMember): boolean {
    return JSON.stringify(before) !== JSON.stringify(after);
  }
}
