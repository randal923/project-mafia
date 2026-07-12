import { Firestore } from "firebase-admin/firestore";
import { BuildingEffect, BuildingInstance } from "../../../shared/building";
import { buildingDefinition } from "../../../shared/buildingCatalog";
import { TurfState } from "../../../shared/territory";
import { FirebaseService } from "./FirebaseService";

/** Merged multipliers/bonuses from everything a player controls. */
export type PlayerEffects = {
  crewHealFactor: number;
  healFactor: number;
  incomeStorageBonusHours: number;
  precinctCostFactor: number;
  sellPriceFactor: number | null;
  staminaCostFactor: number;
  storePriceFactor: number;
  upkeepFactor: number;
  wageFactor: number;
};

const NEUTRAL_EFFECTS: PlayerEffects = {
  crewHealFactor: 1,
  healFactor: 1,
  incomeStorageBonusHours: 0,
  precinctCostFactor: 1,
  sellPriceFactor: null,
  staminaCostFactor: 1,
  storePriceFactor: 1,
  upkeepFactor: 1,
  wageFactor: 1,
};

const CACHE_TTL_MS = 60_000;

/**
 * Resolves the passive perks a player's empire grants: personal holdings
 * (safehouse, warehouse), rackets with perks (chop shop), and captured
 * landmarks. Reads are cached briefly — perks lag ownership changes by a
 * minute at most, which no one will litigate.
 */
export class EffectsService {
  private readonly db: Firestore;
  private readonly cache = new Map<string, { at: number; effects: PlayerEffects }>();
  /** Set by SeasonService once the active season is known. */
  private seasonId: string | null = null;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  bindSeason(seasonId: string): void {
    this.seasonId = seasonId;
  }

  invalidate(uid: string): void {
    this.cache.delete(uid);
  }

  async forPlayer(uid: string): Promise<PlayerEffects> {
    const cached = this.cache.get(uid);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.effects;
    }

    const effects: BuildingEffect[] = [];

    const personal = await this.db
      .collection("players")
      .doc(uid)
      .collection("buildings")
      .get();
    for (const doc of personal.docs) {
      this.collectEffects(doc.data() as BuildingInstance, effects);
    }

    if (this.seasonId) {
      const turfs = await this.db
        .collection("seasons")
        .doc(this.seasonId)
        .collection("turfs")
        .where("ownerUid", "==", uid)
        .get();
      for (const doc of turfs.docs) {
        const turf = doc.data() as TurfState;
        for (const building of turf.buildings) {
          this.collectEffects(building, effects);
        }
        if (turf.landmarkId) {
          const landmark = buildingDefinition(turf.landmarkId);
          for (const effect of landmark?.effects ?? []) {
            effects.push(effect);
          }
        }
      }
    }

    const merged = this.merge(effects);
    this.cache.set(uid, { at: Date.now(), effects: merged });
    return merged;
  }

  private collectEffects(
    instance: BuildingInstance,
    into: BuildingEffect[],
  ): void {
    if (instance.damaged) {
      return;
    }
    const definition = buildingDefinition(instance.definitionId);
    for (const effect of definition?.effects ?? []) {
      into.push(effect);
    }
  }

  private merge(effects: BuildingEffect[]): PlayerEffects {
    const merged = { ...NEUTRAL_EFFECTS };

    for (const effect of effects) {
      switch (effect.type) {
        case "crewHealFactor":
          merged.crewHealFactor *= effect.value;
          break;
        case "healFactor":
          merged.healFactor *= effect.value;
          break;
        case "incomeStorageBonusHours":
          merged.incomeStorageBonusHours += effect.value;
          break;
        case "precinctCostFactor":
          merged.precinctCostFactor *= effect.value;
          break;
        case "sellPriceFactor":
          merged.sellPriceFactor = Math.max(
            merged.sellPriceFactor ?? 0,
            effect.value,
          );
          break;
        case "staminaCostFactor":
          merged.staminaCostFactor *= effect.value;
          break;
        case "storePriceFactor":
          merged.storePriceFactor *= effect.value;
          break;
        case "upkeepFactor":
          merged.upkeepFactor *= effect.value;
          break;
        case "wageFactor":
          merged.wageFactor *= effect.value;
          break;
      }
    }

    return merged;
  }
}
