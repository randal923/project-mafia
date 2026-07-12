import { describe, expect, it, vi } from "vitest";
import {
  WORLD_EVENT_TYPES,
  WORLD_EVENT_WEIGHTS,
  type NewspaperEdition,
  type WorldEvent,
} from "../../../../shared/newspaper";
import type { Season } from "../../../../shared/season";
import type { FirebaseService } from "../FirebaseService";
import { getNewspaperFallbackCopy } from "../getNewspaperFallbackCopy";
import { NewspaperService } from "../NewspaperService";
import type { OpenAiProviderService } from "../ai/OpenAiProviderService";
import type { WorldEventService } from "../WorldEventService";

const season: Season = {
  champion: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  endsAt: "2026-09-01T00:00:00.000Z",
  id: "season-1",
  name: "Season One",
  number: 1,
  startsAt: "2026-07-01T00:00:00.000Z",
  status: "active",
  strongholdCountdown: null,
  updatedAt: "2026-07-01T00:00:00.000Z",
  winner: null,
};

function worldEvent(type: WorldEvent["type"]): WorldEvent {
  return {
    actorName: "Vale",
    actorUid: "actor-1",
    createdAt: "2026-07-12T00:00:00.000Z",
    district: "downtown",
    id: `event-${type}`,
    seasonId: season.id,
    summary: `RAW ENGLISH SUMMARY FOR ${type}`,
    targetName: "Costa",
    targetUid: "target-1",
    type,
    weight: WORLD_EVENT_WEIGHTS[type],
  };
}

describe("NewspaperService", () => {
  it("builds every Portuguese fallback from structured event data", () => {
    for (const type of WORLD_EVENT_TYPES) {
      const copy = getNewspaperFallbackCopy([worldEvent(type)], "pt-BR");
      expect(JSON.stringify(copy)).not.toContain("RAW ENGLISH SUMMARY");
      expect(copy.headline.body).not.toHaveLength(0);
      expect(copy.headline.title).not.toHaveLength(0);
    }

    const english = getNewspaperFallbackCopy([worldEvent("battle")], "en");
    expect(english.headline.body).toBe("RAW ENGLISH SUMMARY FOR battle");

    const brokenCountdown = getNewspaperFallbackCopy(
      [worldEvent("stronghold_countdown_broken")],
      "pt-BR",
    );
    expect(brokenCountdown.headline.title).toContain("interrompido");
    expect(brokenCountdown.headline.body).not.toContain("nova fase");
  });

  it("publishes English and Portuguese fallback copies when AI fails", async () => {
    let savedEdition: NewspaperEdition | null = null;
    const newspaperCollection = {
      doc: () => ({
        set: async (value: unknown) => {
          savedEdition = value as NewspaperEdition;
        },
      }),
    };
    const respectCollection = {
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    };
    const seasonsCollection = {
      doc: () => ({ collection: () => respectCollection }),
    };
    const firebase = {
      firestore: {
        collection: (name: string) =>
          name === "seasons" ? seasonsCollection : newspaperCollection,
      },
    } as unknown as FirebaseService;
    const event = worldEvent("crackdown");
    const worldEvents = {
      since: vi.fn(async () => [event]),
    } as unknown as WorldEventService;
    const generateJson = vi.fn(async (_request: unknown) => {
      throw new Error("provider unavailable");
    });
    const provider = { generateJson } as unknown as OpenAiProviderService;
    const service = new NewspaperService(firebase, worldEvents, provider);

    const edition = await service.generate(
      season,
      "2026-07-11T00:00:00.000Z",
    );

    expect(edition.headline.body).toBe(event.summary);
    expect(edition.ptBR?.headline.title).toBe("Prefeitura mira a família Costa");
    expect(JSON.stringify(edition.ptBR)).not.toContain(event.summary);
    expect(savedEdition).toEqual(edition);
    expect(generateJson).toHaveBeenCalledTimes(2);
    expect(
      generateJson.mock.calls.some(([request]) =>
        JSON.stringify(request).includes("Brazilian Portuguese"),
      ),
    ).toBe(true);
  });
});
