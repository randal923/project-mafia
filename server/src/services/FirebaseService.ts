import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { EnvConfig } from "../config/env";

export class FirebaseService {
  private readonly app: App;

  constructor(config: EnvConfig) {
    this.app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: config.firebaseProjectId,
          clientEmail: config.firebaseClientEmail,
          privateKey: config.firebasePrivateKey,
        }),
      });
  }

  get firestore(): Firestore {
    return getFirestore(this.app);
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  /** Round-trips a Firestore read so health checks report real connectivity. */
  async ping(): Promise<boolean> {
    try {
      await this.firestore.listCollections();
      return true;
    } catch {
      return false;
    }
  }
}
