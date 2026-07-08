import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { Equipment } from "../../../shared/equipment";
import { FirebaseService } from "./FirebaseService";

export class EquipmentService {
  private readonly db: Firestore;

  constructor(firebase: FirebaseService) {
    this.db = firebase.firestore;
  }

  async getEquipment(id: string): Promise<Equipment | null> {
    const snapshot = await this.equipments.doc(id).get();
    return snapshot.exists ? (snapshot.data() as Equipment) : null;
  }

  private get equipments(): CollectionReference {
    return this.db.collection("equipments");
  }
}
