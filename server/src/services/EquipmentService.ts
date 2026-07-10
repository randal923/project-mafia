import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { Equipment, equipmentSchema } from "../../../shared/equipment";
import { FirebaseService } from "./FirebaseService";

/** The catalog changes only on reseed, so cache reads briefly. */
const CATALOG_CACHE_MS = 60_000;

export class EquipmentService {
  private readonly db: Firestore;
  private catalog: Equipment[] | null = null;
  private catalogLoadedAt = 0;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async getEquipment(id: string): Promise<Equipment | null> {
    const cached = this.catalog?.find((item) => item.id === id);
    if (cached) {
      return cached;
    }

    const snapshot = await this.equipments.doc(id).get();
    return snapshot.exists ? this.parse(snapshot.data()) : null;
  }

  /** Full catalog sorted by level gate, then price. */
  async listEquipments(): Promise<Equipment[]> {
    const now = Date.now();
    if (this.catalog && now - this.catalogLoadedAt < CATALOG_CACHE_MS) {
      return this.catalog;
    }

    const snapshot = await this.equipments.get();
    this.catalog = snapshot.docs
      .map((doc) => this.parse(doc.data()))
      .filter((item): item is Equipment => item !== null)
      .sort(
        (a, b) =>
          a.levelRequirement - b.levelRequirement || a.price - b.price,
      );
    this.catalogLoadedAt = now;
    return this.catalog;
  }

  /**
   * Docs predating the current schema (e.g. seeded before prices existed)
   * are dropped rather than served half-formed to the client.
   */
  private parse(data: unknown): Equipment | null {
    const result = equipmentSchema.safeParse(data);
    if (!result.success) {
      console.warn(
        "Skipping equipment doc that fails the schema:",
        (data as { id?: string })?.id ?? "(no id)",
      );
      return null;
    }
    return result.data;
  }

  private get equipments(): CollectionReference {
    return this.db.collection("equipments");
  }
}
