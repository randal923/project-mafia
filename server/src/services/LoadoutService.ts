import { Firestore } from "firebase-admin/firestore";
import {
  EquipmentSlotId,
  Player,
  PlayerItem,
  normalizePlayer,
} from "../../../shared/player";
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

      const updated: Player = {
        ...change(normalizePlayer(snapshot.data() as Player)),
        updatedAt: new Date().toISOString(),
      };

      tx.set(playerRef, updated);
      return updated;
    });
  }
}
