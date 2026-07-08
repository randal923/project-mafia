import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { Player, createNewPlayer } from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { FirebaseService } from "./FirebaseService";

export class PlayerService {
  private readonly db: Firestore;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async getPlayer(uid: string): Promise<Player | null> {
    const snapshot = await this.players.doc(uid).get();
    return snapshot.exists ? (snapshot.data() as Player) : null;
  }

  /**
   * Creates the player inside a transaction, checking the case-insensitive
   * nameKey field on existing player docs to keep names unique.
   */
  async createPlayer(uid: string, name: string): Promise<Player> {
    const player = createNewPlayer(uid, name, new Date().toISOString());
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

  private get players(): CollectionReference {
    return this.db.collection("players");
  }
}
