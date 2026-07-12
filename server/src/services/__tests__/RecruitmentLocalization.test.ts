import { describe, expect, it } from "vitest";
import {
  CREW_ARCHETYPE_IDS,
  type CrewRecruitmentPool,
} from "../../../../shared/crew";
import { getCrewFallbackBios } from "../getCrewFallbackBios";
import { isRecruitmentPoolCurrent } from "../isRecruitmentPoolCurrent";

const NOW = Date.parse("2026-07-12T12:00:00.000Z");

describe("recruitment localization", () => {
  it("provides Brazilian Portuguese fallback bios for every archetype", () => {
    for (const archetype of CREW_ARCHETYPE_IDS) {
      const portugueseBios = getCrewFallbackBios("pt-BR", archetype);
      const englishBios = getCrewFallbackBios("en", archetype);

      expect(portugueseBios).toHaveLength(2);
      expect(portugueseBios).not.toEqual(englishBios);
      expect(portugueseBios.every((bio) => bio.length > 0)).toBe(true);
    }
  });

  it("invalidates cached pools when the player changes language", () => {
    const recentPool: CrewRecruitmentPool = {
      candidates: [],
      generatedAt: "2026-07-12T11:00:00.000Z",
    };

    expect(isRecruitmentPoolCurrent(recentPool, "en", NOW)).toBe(true);
    expect(isRecruitmentPoolCurrent(recentPool, "pt-BR", NOW)).toBe(false);
    expect(
      isRecruitmentPoolCurrent(
        { ...recentPool, language: "pt-BR" },
        "pt-BR",
        NOW,
      ),
    ).toBe(true);
  });

  it("invalidates expired pools even when their language matches", () => {
    const expiredPool: CrewRecruitmentPool = {
      candidates: [],
      generatedAt: "2026-07-10T11:00:00.000Z",
      language: "pt-BR",
    };

    expect(isRecruitmentPoolCurrent(expiredPool, "pt-BR", NOW)).toBe(false);
  });

  it("invalidates pools whose timestamps are in the future", () => {
    const futurePool: CrewRecruitmentPool = {
      candidates: [],
      generatedAt: "2026-07-13T11:00:00.000Z",
      language: "pt-BR",
    };

    expect(isRecruitmentPoolCurrent(futurePool, "pt-BR", NOW)).toBe(false);
  });
});
