import { Equipment, equipmentToPlayerItem } from "../../../shared/equipment";
import {
  Player,
  PlayerItem,
  PlayerLoadout,
  normalizePlayer,
} from "../../../shared/player";
import { EnvConfig } from "../config/env";
import { FirebaseService } from "../services/FirebaseService";

/** Re-stamps a stored item snapshot from the current equipment doc. */
function refreshItem(
  item: PlayerItem,
  equipments: Map<string, Equipment>,
): PlayerItem {
  const equipment = equipments.get(item.id);
  if (!equipment) {
    return item;
  }
  return { ...item, ...equipmentToPlayerItem(equipment, item.quantity ?? 1) };
}

async function backfillPlayers(): Promise<void> {
  const config = new EnvConfig();
  const firebase = new FirebaseService(config);
  const [playerSnapshot, equipmentSnapshot] = await Promise.all([
    firebase.firestore.collection("players").get(),
    firebase.firestore.collection("equipments").get(),
  ]);

  const equipments = new Map(
    equipmentSnapshot.docs.map((doc) => [doc.id, doc.data() as Equipment]),
  );

  let updated = 0;

  for (const doc of playerSnapshot.docs) {
    const stored = doc.data() as Player;
    const normalized = normalizePlayer(stored);

    const loadout: PlayerLoadout = Object.fromEntries(
      Object.entries(normalized.loadout).map(([slot, item]) => [
        slot,
        item ? refreshItem(item, equipments) : item,
      ]),
    );
    const refreshed: Player = {
      ...normalized,
      loadout,
      stash: normalized.stash.map((item) => refreshItem(item, equipments)),
    };

    if (JSON.stringify(stored) === JSON.stringify(refreshed)) {
      continue;
    }

    await doc.ref.set(refreshed, { merge: true });
    updated += 1;
  }

  console.log(`Backfilled ${updated} of ${playerSnapshot.size} player(s).`);
}

backfillPlayers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to backfill players:", err);
    process.exit(1);
  });
