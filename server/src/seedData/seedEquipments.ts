import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Equipment, equipmentCatalogSchema } from "../../../shared/equipment";
import { EnvConfig } from "../config/env";
import { FirebaseService } from "../services/FirebaseService";

function loadEquipments(): Equipment[] {
  const file = join(__dirname, "equipments.json");
  return equipmentCatalogSchema.parse(JSON.parse(readFileSync(file, "utf-8")));
}

async function seedEquipments(): Promise<void> {
  const config = new EnvConfig();
  const firebase = new FirebaseService(config);
  const equipments = loadEquipments();
  const collection = firebase.firestore.collection("equipments");

  // Full set (no merge) so retired fields don't linger on catalog docs.
  await Promise.all(
    equipments.map((equipment) =>
      collection.doc(equipment.id).set(equipment),
    ),
  );

  console.log(`Seeded ${equipments.length} equipment(s).`);
}

seedEquipments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed equipments:", err);
    process.exit(1);
  });
