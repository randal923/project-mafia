import { CollectionReference, Firestore } from "firebase-admin/firestore";
import {
  STARTER_EQUIPMENT_ID,
  equipmentToPlayerItem,
} from "../../../shared/equipment";
import { decayedHeat } from "../../../shared/heat";
import { recoveredHealth } from "../../../shared/health";
import { soberedIntoxication } from "../../../shared/intoxication";
import { regeneratedStamina } from "../../../shared/stamina";
import { roundToFive } from "../engine/math";
import {
  Player,
  PlayerLanguage,
  PlayerLoadout,
  createNewPlayer,
  normalizePlayer,
} from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { EffectsService } from "./EffectsService";
import { EngineConfigService } from "./EngineConfigService";
import { EquipmentService } from "./EquipmentService";
import { FirebaseService } from "./FirebaseService";

export class PlayerService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly equipment: EquipmentService,
    private readonly engine: EngineConfigService,
    private readonly effects: EffectsService,
  ) {
    this.db = firebase.firestore;
  }

  async getPlayer(uid: string): Promise<Player | null> {
    const snapshot = await this.players.doc(uid).get();
    if (!snapshot.exists) {
      return null;
    }

    return this.applyIdleRecovery(normalizePlayer(snapshot.data() as Player));
  }

  /**
   * Everything idle time repairs, applied lazily on read and persisted so
   * the next transaction sees it: heat decays, stamina and Health recover,
   * intoxication clears, and a served-out prison sentence is lifted — doing
   * the full time also shaves off some heat.
   */
  private async applyIdleRecovery(player: Player): Promise<Player> {
    const nowIso = new Date().toISOString();
    const prison = this.engine.config.prison;

    let heat = decayedHeat(player.resources.heat, player.updatedAt, nowIso);
    const stamina = regeneratedStamina(
      player.resources.stamina,
      player.updatedAt,
      nowIso,
    );
    const high = soberedIntoxication(
      player.resources.high,
      player.updatedAt,
      nowIso,
    );
    const drunk = soberedIntoxication(
      player.resources.drunk,
      player.updatedAt,
      nowIso,
    );
    const health = recoveredHealth(
      player.resources.health,
      player.updatedAt,
      nowIso,
    );

    let released = false;
    if (player.prison && Date.parse(player.prison.releaseAt) <= Date.now()) {
      released = true;
      heat = Math.max(0, heat - prison.serveHeatRelief);
    }

    if (
      heat === player.resources.heat &&
      stamina === player.resources.stamina &&
      high === player.resources.high &&
      drunk === player.resources.drunk &&
      health === player.resources.health &&
      !released
    ) {
      return player;
    }

    const updated: Player = {
      ...player,
      prison: released ? null : player.prison,
      resources: { ...player.resources, drunk, health, heat, high, stamina },
      updatedAt: nowIso,
    };

    await this.players.doc(player.id).update({
      "resources.drunk": drunk,
      "resources.health": health,
      "resources.heat": heat,
      "resources.high": high,
      "resources.stamina": stamina,
      ...(released && { prison: null }),
      updatedAt: nowIso,
    });

    return updated;
  }

  async createPlayer(
    uid: string,
    name: string,
    language: PlayerLanguage | null = null,
  ): Promise<Player> {
    const loadout = await this.starterLoadout();
    const player = createNewPlayer(
      uid,
      name,
      new Date().toISOString(),
      loadout,
      language,
    );
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

  /** Sets the player's UI/narration language and returns the updated doc. */
  async setLanguage(uid: string, language: PlayerLanguage): Promise<Player> {
    const playerRef = this.players.doc(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const player = normalizePlayer(snapshot.data() as Player);
      const updated: Player = {
        ...player,
        language,
        updatedAt: new Date().toISOString(),
      };

      tx.set(playerRef, updated);
      return updated;
    });
  }

  /**
   * What the precinct charges to make `chunk` heat disappear. Corruption
   * skill talks the price down (capped discount); the family holding the
   * Precinct HQ pays wholesale.
   */
  precinctQuote(player: Player, costFactor = 1): { chunk: number; cost: number } {
    const { precinct } = this.engine.config;
    const discount = Math.min(
      precinct.maxDiscount,
      player.progression.skills.corruption * precinct.discountPerCorruption,
    );
    const cost = roundToFive(
      (precinct.baseCost +
        precinct.costPerLevel * player.progression.level) *
        (1 - discount) *
        costFactor,
    );

    return { chunk: precinct.chunk, cost };
  }

  /** The quote with every empire perk applied. */
  async precinctQuoteWithPerks(
    player: Player,
  ): Promise<{ chunk: number; cost: number }> {
    const { precinctCostFactor } = await this.effects.forPlayer(player.id);
    return this.precinctQuote(player, precinctCostFactor);
  }

  /** Pays off the precinct: cash down, heat down. */
  async bribeHeat(uid: string): Promise<Player> {
    const playerRef = this.players.doc(uid);
    const { precinctCostFactor } = await this.effects.forPlayer(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }

      const player = normalizePlayer(snapshot.data() as Player);
      if (player.prison) {
        throw new HttpError(403, "The precinct doesn't take calls from a cell.");
      }
      if (player.resources.heat <= 0) {
        throw new HttpError(400, "You're already cold — nothing to pay for.");
      }

      const quote = this.precinctQuote(player, precinctCostFactor);
      if (player.resources.cash < quote.cost) {
        throw new HttpError(402, "You can't afford the envelope.");
      }

      const updated: Player = {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash - quote.cost,
          heat: Math.max(0, player.resources.heat - quote.chunk),
        },
        updatedAt: new Date().toISOString(),
      };

      tx.set(playerRef, updated);
      return updated;
    });
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
