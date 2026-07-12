import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { DistrictId } from "../../../shared/district";
import {
  WORLD_EVENT_WEIGHTS,
  WorldEvent,
  WorldEventType,
} from "../../../shared/newspaper";
import { FirebaseService } from "./FirebaseService";

/**
 * The city's public record: every turf flip, battle, raid, and crackdown
 * lands here as a plain factual sentence. The newspaper reads this feed;
 * the LLM writes prose around it and never invents an event.
 */
export class WorldEventService {
  private readonly db: Firestore;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async emit(
    seasonId: string,
    type: WorldEventType,
    summary: string,
    details: Partial<
      Pick<
        WorldEvent,
        "actorName" | "actorUid" | "district" | "targetName" | "targetUid"
      >
    > = {},
  ): Promise<void> {
    const event: WorldEvent = {
      actorName: details.actorName ?? null,
      actorUid: details.actorUid ?? null,
      createdAt: new Date().toISOString(),
      district: (details.district as DistrictId | undefined) ?? null,
      id: randomUUID(),
      seasonId,
      summary,
      targetName: details.targetName ?? null,
      targetUid: details.targetUid ?? null,
      type,
      weight: WORLD_EVENT_WEIGHTS[type],
    };

    await this.events(seasonId).doc(event.id).set(event);
  }

  /** Events since `sinceIso`, newest first, for edition building. */
  async since(seasonId: string, sinceIso: string): Promise<WorldEvent[]> {
    const snapshot = await this.events(seasonId)
      .where("createdAt", ">", sinceIso)
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    return snapshot.docs.map((doc) => doc.data() as WorldEvent);
  }

  private events(seasonId: string): CollectionReference {
    return this.db
      .collection("seasons")
      .doc(seasonId)
      .collection("events");
  }
}
