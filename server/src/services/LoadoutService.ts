import { Firestore } from "firebase-admin/firestore";
import {
  MAX_INTOXICATION,
  toleranceMultiplier,
} from "../../../shared/intoxication";
import { MAX_HEALTH, recoveredHealth } from "../../../shared/health";
import {
  EquipmentSlotId,
  MAX_HEAT,
  MAX_STAMINA,
  Player,
  PlayerItem,
  normalizePlayer,
} from "../../../shared/player";
import { HealthService } from "../engine/HealthService";
import { clamp } from "../engine/math";
import { HttpError } from "../middleware/errorHandler";
import { FirebaseService } from "./FirebaseService";

/**
 * Moves gear between the stash and the five loadout slots. Only equipped
 * items contribute power, armor, and effects; mission rolls snapshot the
 * loadout at accept time, so mid-mission changes affect the NEXT job.
 */
export class LoadoutService {
  private readonly db: Firestore;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async equip(uid: string, itemId: string): Promise<Player> {
    return this.mutate(uid, (player) => {
      const index = player.stash.findIndex((entry) => entry.id === itemId);
      if (index === -1) {
        throw new HttpError(404, "That item isn't in your stash.");
      }

      const item = player.stash[index]!;
      const slot = item.slot as EquipmentSlotId | undefined;
      if (!slot) {
        throw new HttpError(400, "That item can't be equipped — it's used from the stash.");
      }
      if (
        item.levelRequirement !== undefined &&
        player.progression.level < item.levelRequirement
      ) {
        throw new HttpError(
          403,
          `You need to be level ${item.levelRequirement} to use that.`,
        );
      }

      const stash = this.removeOne(player.stash, index);
      const replaced = player.loadout[slot];
      if (replaced) {
        stash.push(replaced);
      }

      return {
        ...player,
        loadout: { ...player.loadout, [slot]: { ...item, quantity: 1 } },
        stash,
      };
    });
  }

  async unequip(uid: string, slot: EquipmentSlotId): Promise<Player> {
    return this.mutate(uid, (player) => {
      const item = player.loadout[slot];
      if (!item) {
        throw new HttpError(404, "That slot is already empty.");
      }

      const loadout = { ...player.loadout };
      delete loadout[slot];

      return {
        ...player,
        loadout,
        stash: [...player.stash, item],
      };
    });
  }

  /**
   * Uses one consumable with a `use` effect (drugs, liquor): stamina back,
   * heat ±, and the buzz climbs. Tolerance bites — the higher (or drunker)
   * you already are, the less stamina the dose actually restores.
   */
  async useItem(uid: string, itemId: string): Promise<Player> {
    return this.mutate(uid, (player) => {
      const index = player.stash.findIndex((entry) => entry.id === itemId);
      if (index === -1) {
        throw new HttpError(404, "That item isn't in your stash.");
      }

      const item = player.stash[index]!;
      const use = item.use;
      if (
        !use ||
        (!use.stamina && !use.health && !use.heat && !use.high && !use.drunk)
      ) {
        throw new HttpError(400, "That item can't be used — it's gear, not a fix.");
      }
      if (
        item.levelRequirement !== undefined &&
        player.progression.level < item.levelRequirement
      ) {
        throw new HttpError(
          403,
          `You need to be level ${item.levelRequirement} to handle that.`,
        );
      }
      const reserved = player.reservedEquipment?.items[item.id] ?? 0;
      if ((item.quantity ?? 1) <= reserved) {
        throw new HttpError(
          409,
          "That item is packed for your active job and can't be used right now.",
        );
      }
      if (use.health && player.resources.health >= MAX_HEALTH) {
        throw new HttpError(400, "You're already at full health.");
      }

      // Tolerance runs on the meter the dose feeds: drugs check how high
      // you are, liquor checks how drunk.
      const toleranceLevel = use.high
        ? player.resources.high
        : use.drunk
          ? player.resources.drunk
          : 0;
      const restored = Math.round(
        (use.stamina ?? 0) * toleranceMultiplier(toleranceLevel),
      );

      const healed = use.health
        ? HealthService.heal(player, use.health, player.updatedAt)
        : player;

      return {
        ...healed,
        resources: {
          ...healed.resources,
          drunk: clamp(
            player.resources.drunk + (use.drunk ?? 0),
            0,
            MAX_INTOXICATION,
          ),
          heat: clamp(player.resources.heat + (use.heat ?? 0), 0, MAX_HEAT),
          high: clamp(
            player.resources.high + (use.high ?? 0),
            0,
            MAX_INTOXICATION,
          ),
          stamina: clamp(
            player.resources.stamina + restored,
            0,
            MAX_STAMINA,
          ),
        },
        stash: this.removeOne(player.stash, index),
      };
    });
  }

  private removeOne(stash: PlayerItem[], index: number): PlayerItem[] {
    const item = stash[index]!;
    const owned = item.quantity ?? 1;
    return owned > 1
      ? stash.map((entry, i) =>
          i === index ? { ...entry, quantity: owned - 1 } : entry,
        )
      : stash.filter((_, i) => i !== index);
  }

  private async mutate(
    uid: string,
    change: (player: Player) => Player,
  ): Promise<Player> {
    const playerRef = this.db.collection("players").doc(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const nowIso = new Date().toISOString();
      const stored = normalizePlayer(snapshot.data() as Player);
      const current: Player = {
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
      const updated: Player = {
        ...change(current),
        updatedAt: nowIso,
      };

      tx.set(playerRef, updated);
      return updated;
    });
  }
}
