import { Firestore } from "firebase-admin/firestore";
import { gameDaysToRealMs } from "../../../shared/gameTime";
import {
  DEFAULT_PLAYER_LANGUAGE,
  type PlayerLanguage,
} from "../../../shared/language";
import { MAX_HEAT, Player, PlayerPrison, normalizePlayer } from "../../../shared/player";
import { clamp, roundToFive } from "../engine/math";
import { HttpError } from "../middleware/errorHandler";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";

import {
  PrisonAttemptResult,
  PrisonStatus,
} from "../../../shared/prison";

/**
 * The county lockup. A disaster job outcome lands the player here for a
 * sentence measured in game days (1 game day = 1 real hour). Three ways
 * out: charm a guard (charisma check, cash up front win or lose), break
 * out (stealth check, failing extends the stay), or serve the time —
 * which also cools some heat, because the trail went cold.
 */
export class PrisonService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly engine: EngineConfigService,
  ) {
    this.db = firebase.firestore;
  }

  /** Builds the sentence written onto the player when a job ends in arrest. */
  sentence(
    reason: string,
    nowIso: string,
    reasonLanguage: PlayerLanguage = DEFAULT_PLAYER_LANGUAGE,
  ): PlayerPrison {
    const config = this.engine.config.prison;
    const releaseAt = new Date(
      Date.parse(nowIso) + gameDaysToRealMs(config.sentenceGameDays),
    ).toISOString();

    return {
      attemptCooldownUntil: null,
      reason,
      reasonLanguage,
      releaseAt,
      sentencedAt: nowIso,
    };
  }

  status(player: Player): PrisonStatus {
    if (!player.prison) {
      throw new HttpError(404, { code: "not_imprisoned" });
    }

    return {
      attemptCooldownUntil: player.prison.attemptCooldownUntil,
      bribeChance: this.bribeChance(player),
      bribeCost: this.bribeCost(player),
      escapeChance: this.escapeChance(player),
      prison: player.prison,
    };
  }

  /** Slip a guard an envelope: charisma decides if he looks away. */
  async bribe(uid: string): Promise<PrisonAttemptResult> {
    return this.attempt(uid, (player) => {
      const cost = this.bribeCost(player);
      if (player.resources.cash < cost) {
        throw new HttpError(402, {
          code: "insufficient_cash",
          params: { amount: cost },
        });
      }

      const succeeded = this.roll(this.bribeChance(player));
      // The envelope changes hands either way.
      const resources = {
        ...player.resources,
        cash: player.resources.cash - cost,
      };

      return { extendOnFail: false, resources, succeeded };
    });
  }

  /** Go over the wall: stealth decides; failure extends the sentence. */
  async escape(uid: string): Promise<PrisonAttemptResult> {
    const config = this.engine.config.prison;

    return this.attempt(uid, (player) => {
      const succeeded = this.roll(this.escapeChance(player));
      const resources = succeeded
        ? {
            ...player.resources,
            heat: clamp(
              player.resources.heat + config.escapeHeat,
              0,
              MAX_HEAT,
            ),
          }
        : player.resources;

      return { extendOnFail: true, resources, succeeded };
    });
  }

  private async attempt(
    uid: string,
    run: (player: Player) => {
      /** Whether failing also lengthens the sentence (escapes do). */
      extendOnFail: boolean;
      resources: Player["resources"];
      succeeded: boolean;
    },
  ): Promise<PrisonAttemptResult> {
    const config = this.engine.config.prison;
    const playerRef = this.db.collection("players").doc(uid);

    return this.db.runTransaction(async (tx) => {
      const snapshot = await tx.get(playerRef);
      if (!snapshot.exists) {
        throw new HttpError(404, { code: "player_not_found" });
      }

      const player = normalizePlayer(snapshot.data() as Player);
      const prison = player.prison;
      const now = Date.now();
      if (!prison) {
        throw new HttpError(400, { code: "not_imprisoned" });
      }
      if (Date.parse(prison.releaseAt) <= now) {
        // Sentence is already served; the next read releases them.
        throw new HttpError(409, { code: "release_pending" });
      }
      if (
        prison.attemptCooldownUntil &&
        Date.parse(prison.attemptCooldownUntil) > now
      ) {
        throw new HttpError(429, { code: "prison_attempt_cooldown" });
      }

      const { extendOnFail, resources, succeeded } = run(player);
      const nowIso = new Date(now).toISOString();

      const updated: Player = succeeded
        ? { ...player, prison: null, resources, updatedAt: nowIso }
        : {
            ...player,
            prison: {
              ...prison,
              attemptCooldownUntil: new Date(
                now + config.attemptCooldownMinutes * 60_000,
              ).toISOString(),
              releaseAt: extendOnFail
                ? new Date(
                    Date.parse(prison.releaseAt) +
                      config.escapeFailExtensionMinutes * 60_000,
                  ).toISOString()
                : prison.releaseAt,
            },
            resources,
            updatedAt: nowIso,
          };

      tx.set(playerRef, updated);
      return { player: updated, succeeded };
    });
  }

  private bribeCost(player: Player): number {
    const config = this.engine.config.prison;
    return roundToFive(
      config.bribeBaseCost +
        config.bribeCostPerLevel * player.progression.level,
    );
  }

  private bribeChance(player: Player): number {
    const config = this.engine.config.prison;
    return clamp(
      Math.round(
        config.bribeBaseChance +
          config.bribePerCharisma * player.progression.skills.charisma,
      ),
      config.minChance,
      config.maxChance,
    );
  }

  private escapeChance(player: Player): number {
    const config = this.engine.config.prison;
    return clamp(
      Math.round(
        config.escapeBaseChance +
          config.escapePerStealth * player.progression.skills.stealth,
      ),
      config.minChance,
      config.maxChance,
    );
  }

  private roll(chance: number): boolean {
    return Math.random() * 100 < chance;
  }
}
