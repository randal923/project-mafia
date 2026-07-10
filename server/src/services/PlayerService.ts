import { CollectionReference, Firestore } from "firebase-admin/firestore";
import {
  STARTER_EQUIPMENT_ID,
  equipmentToPlayerItem,
} from "../../../shared/equipment";
import { decayedHeat } from "../../../shared/heat";
import {
  Player,
  PlayerLoadout,
  createNewPlayer,
  normalizePlayer,
} from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { EquipmentService } from "./EquipmentService";
import { FirebaseService } from "./FirebaseService";

export class PlayerService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly equipment: EquipmentService,
  ) {
    this.db = firebase.firestore;
  }

  async getPlayer(uid: string): Promise<Player | null> {
    const snapshot = await this.players.doc(uid).get();
    if (!snapshot.exists) {
      return null;
    }

    return this.applyHeatDecay(normalizePlayer(snapshot.data() as Player));
  }

  /**
   * Laying low pays: heat bleeds off with idle time (shared/heat.ts).
   * Persisted on read so the next transaction sees the cooled value.
   */
  private applyHeatDecay(player: Player): Player {
    const nowIso = new Date().toISOString();
    const cooled = decayedHeat(player.resources.heat, player.updatedAt, nowIso);
    if (cooled >= player.resources.heat) {
      return player;
    }

    const updated: Player = {
      ...player,
      resources: { ...player.resources, heat: cooled },
      updatedAt: nowIso,
    };

    this.players
      .doc(player.id)
      .update({ "resources.heat": cooled, updatedAt: nowIso })
      .catch((err) => {
        console.error(`Failed to persist heat decay for ${player.id}:`, err);
      });

    return updated;
  }

  async createPlayer(uid: string, name: string): Promise<Player> {
    const loadout = await this.starterLoadout();
    const player = createNewPlayer(uid, name, new Date().toISOString(), loadout);
    const playerRef = this.players.doc(uid);
    const sameNameQuery = this.players
      .where("nameKey", "==", player.nameKey)
      .limit(1);

    await this.db.runTransaction(async (tx) => {
      const [existingPlayer, sameName] = await Promise.all([
        tx.get(playerRef),
        tx.get(sameNameQuery),
      ]);

      if (existingPlayer.exists) {
        throw new HttpError(409, "You already have a player.");
      }
      if (!sameName.empty) {
        throw new HttpError(409, "That name is already taken.");
      }

      tx.create(playerRef, player);
    });

    return player;
  }

  private async starterLoadout(): Promise<PlayerLoadout> {
    const knife = await this.equipment.getEquipment(STARTER_EQUIPMENT_ID);

    if (!knife || knife.slot === null) {
      throw new HttpError(500, "Starter equipment is missing.");
    }

    return { [knife.slot]: equipmentToPlayerItem(knife) };
  }

  private get players(): CollectionReference {
    return this.db.collection("players");
  }
}
