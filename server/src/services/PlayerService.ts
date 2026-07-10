import { CollectionReference, Firestore } from "firebase-admin/firestore";
import {
  STARTER_EQUIPMENT_ID,
  equipmentToPlayerItem,
} from "../../../shared/equipment";
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
    return snapshot.exists ? normalizePlayer(snapshot.data() as Player) : null;
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

    if (!knife) {
      throw new HttpError(500, "Starter equipment is missing.");
    }

    return { [knife.slot]: equipmentToPlayerItem(knife) };
  }

  private get players(): CollectionReference {
    return this.db.collection("players");
  }
}
