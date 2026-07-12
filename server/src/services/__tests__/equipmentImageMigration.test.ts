import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CrewMember,
  normalizeCrewMember,
} from "../../../../shared/crew";
import { equipmentCatalogSchema } from "../../../../shared/equipment";
import { normalizeEquipmentImage } from "../../../../shared/normalizeEquipmentImage";
import {
  type PlayerItem,
  createNewPlayer,
  normalizePlayer,
} from "../../../../shared/player";
import { EquipmentService } from "../EquipmentService";
import type { FirebaseService } from "../FirebaseService";

const legacyItem: PlayerItem = {
  id: "stiletto-knife",
  image: {
    alt: "Stiletto knife",
    src: "/images/items/stiletto-knife.png",
  },
  name: "Stiletto Knife",
};

describe("equipment image migration", () => {
  it("rewrites only legacy equipment asset paths", () => {
    expect(normalizeEquipmentImage(legacyItem.image!)).toEqual({
      alt: "Stiletto knife",
      src: "/images/items/stiletto-knife.webp",
    });

    const current = {
      alt: "Stiletto knife",
      src: "/images/items/stiletto-knife.webp",
    };
    expect(normalizeEquipmentImage(current)).toBe(current);

    const unrelated = { alt: "Portrait", src: "/images/portraits/don.png" };
    expect(normalizeEquipmentImage(unrelated)).toBe(unrelated);
  });

  it("migrates stored player stash and loadout images without mutation", () => {
    const player = createNewPlayer(
      "player-1",
      "Test Player",
      "2026-07-12T00:00:00.000Z",
      { hand: legacyItem },
    );
    player.stash = [{ ...legacyItem, id: "spare-knife" }];

    const normalized = normalizePlayer(player);

    expect(normalized.loadout.hand?.image?.src).toBe(
      "/images/items/stiletto-knife.webp",
    );
    expect(normalized.stash[0]?.image?.src).toBe(
      "/images/items/stiletto-knife.webp",
    );
    expect(player.loadout.hand?.image?.src).toBe(
      "/images/items/stiletto-knife.png",
    );
  });

  it("migrates active and confiscated crew loadout images", () => {
    const member: CrewMember = {
      archetype: "enforcer",
      assignment: null,
      bio: "Test bio",
      busyUntil: null,
      confiscatedLoadout: { torso: legacyItem },
      createdAt: "2026-07-12T00:00:00.000Z",
      id: "crew-1",
      loadout: { hand: legacyItem },
      loyalty: 100,
      name: "Test Crew",
      skillLevel: 1,
      status: "idle",
      tier: 1,
      traits: [],
      unpaidSince: null,
      updatedAt: "2026-07-12T00:00:00.000Z",
      wagesSettledAt: "2026-07-12T00:00:00.000Z",
    };

    const normalized = normalizeCrewMember(member);

    expect(normalized.loadout.hand?.image?.src).toBe(
      "/images/items/stiletto-knife.webp",
    );
    expect(normalized.confiscatedLoadout?.torso?.image?.src).toBe(
      "/images/items/stiletto-knife.webp",
    );
  });

  it("normalizes legacy image paths read from the Firestore catalog", async () => {
    const catalog = equipmentCatalogSchema.parse(
      JSON.parse(
        readFileSync(
          join(process.cwd(), "src", "seedData", "equipments.json"),
          "utf8",
        ),
      ),
    );
    const legacyEquipment = {
      ...catalog[0]!,
      image: {
        ...catalog[0]!.image,
        src: "/images/items/stiletto-knife.png",
      },
    };
    const firebase = {
      firestore: {
        collection: () => ({
          get: async () => ({
            docs: [{ data: () => legacyEquipment }],
          }),
        }),
      },
    } as unknown as FirebaseService;

    const service = new EquipmentService(firebase);
    const [equipment] = await service.listEquipments();

    expect(equipment?.image.src).toBe("/images/items/stiletto-knife.webp");
  });
});
