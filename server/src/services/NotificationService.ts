import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import {
  NOTIFICATION_PAGE_SIZE,
  NotificationType,
  PlayerNotification,
} from "../../../shared/notification";
import { FirebaseService } from "./FirebaseService";

/**
 * Player-facing event feed. Every consequence that lands while the player
 * is away (attacks, raids, desertions, releases) goes through here so the
 * login catch-up can replay it.
 */
export class NotificationService {
  private readonly db: Firestore;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async push(
    uid: string,
    type: NotificationType,
    title: string,
    body: string,
    refId: string | null = null,
  ): Promise<void> {
    const notification: PlayerNotification = {
      body,
      createdAt: new Date().toISOString(),
      id: randomUUID(),
      read: false,
      refId,
      title,
      type,
    };

    await this.feed(uid).doc(notification.id).set(notification);
  }

  async list(uid: string): Promise<PlayerNotification[]> {
    const snapshot = await this.feed(uid)
      .orderBy("createdAt", "desc")
      .limit(NOTIFICATION_PAGE_SIZE)
      .get();

    return snapshot.docs.map((doc) => doc.data() as PlayerNotification);
  }

  /** Marks everything currently unread as read. */
  async markAllRead(uid: string): Promise<void> {
    const snapshot = await this.feed(uid)
      .where("read", "==", false)
      .limit(NOTIFICATION_PAGE_SIZE)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = this.db.batch();
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, { read: true });
    }
    await batch.commit();
  }

  private feed(uid: string): CollectionReference {
    return this.db
      .collection("players")
      .doc(uid)
      .collection("notifications");
  }
}
