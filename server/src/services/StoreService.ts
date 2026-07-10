import { Firestore } from "firebase-admin/firestore";
import {
  Equipment,
  equipmentToPlayerItem,
  meetsLevelRequirement,
  sellPrice,
} from "../../../shared/equipment";
import { recoveredHealth } from "../../../shared/health";
import { Player, normalizePlayer } from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { EquipmentService } from "./EquipmentService";
import { FirebaseService } from "./FirebaseService";

/**
 * The armory: turns mission cash into gear. Buying lands items in the
 * stash (equip from the character screen); selling pays half price back.
 */
export class StoreService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly equipment: EquipmentService,
  ) {
    this.db = firebase.firestore;
  }

  async catalog(): Promise<Equipment[]> {
    return this.equipment.listEquipments();
  }

  async buy(uid: string, equipmentId: string, quantity = 1): Promise<Player> {
    const item = await this.equipment.getEquipment(equipmentId);
    if (!item) {
      throw new HttpError(404, "The store doesn't carry that.");
    }

    // Only consumables stack; wearables and weapons are one per purchase.
    const amount = item.consumable ? quantity : 1;
    const cost = item.price * amount;
    const playerRef = this.db.collection("players").doc(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const nowIso = new Date().toISOString();
      const stored = normalizePlayer(snapshot.data() as Player);
      const player: Player = {
        ...stored,
        resources: {
          ...stored.resources,
          health: recoveredHealth(
            stored.resources.health,
            stored.updatedAt,
            nowIso,
          ),
        },
      };
      if (!meetsLevelRequirement(player.progression.level, item)) {
        throw new HttpError(
          403,
          `You need to be level ${item.levelRequirement} to buy that.`,
        );
      }
      if (player.resources.cash < cost) {
        throw new HttpError(402, "You can't afford that.");
      }

      const updated: Player = {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash - cost,
        },
        stash: this.addToStash(player.stash, item, amount),
        updatedAt: nowIso,
      };

      tx.set(playerRef, updated);
      return updated;
    });
  }

  async sell(uid: string, itemId: string, quantity = 1): Promise<Player> {
    const playerRef = this.db.collection("players").doc(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const nowIso = new Date().toISOString();
      const stored = normalizePlayer(snapshot.data() as Player);
      const player: Player = {
        ...stored,
        resources: {
          ...stored.resources,
          health: recoveredHealth(
            stored.resources.health,
            stored.updatedAt,
            nowIso,
          ),
        },
      };
      const index = player.stash.findIndex((entry) => entry.id === itemId);
      if (index === -1) {
        throw new HttpError(404, "That item isn't in your stash.");
      }

      const item = player.stash[index]!;
      const owned = item.quantity ?? 1;
      const reserved = player.reservedEquipment?.items[item.id] ?? 0;
      const available = Math.max(0, owned - reserved);
      if (available === 0) {
        throw new HttpError(
          409,
          "That quantity is packed for your active job and can't be sold.",
        );
      }
      const amount = Math.min(available, quantity);
      const payout = sellPrice(item.price ?? 0, amount);
      const remaining = owned - amount;

      const updated: Player = {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash + payout,
        },
        stash:
          remaining > 0
            ? player.stash.map((entry, i) =>
                i === index ? { ...entry, quantity: remaining } : entry,
              )
            : player.stash.filter((_, i) => i !== index),
        updatedAt: nowIso,
      };

      tx.set(playerRef, updated);
      return updated;
    });
  }

  private addToStash(
    stash: Player["stash"],
    item: Equipment,
    amount: number,
  ): Player["stash"] {
    if (item.consumable) {
      const index = stash.findIndex((entry) => entry.id === item.id);
      if (index !== -1) {
        return stash.map((entry, i) =>
          i === index
            ? { ...entry, quantity: (entry.quantity ?? 1) + amount }
            : entry,
        );
      }
    }

    return [...stash, equipmentToPlayerItem(item, amount)];
  }
}
