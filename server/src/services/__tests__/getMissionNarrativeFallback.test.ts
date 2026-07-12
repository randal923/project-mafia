import { describe, expect, it } from "vitest";
import { OUTCOME_TIERS, type JobOffer, type MissionNode } from "../../../../shared/job";
import { getMissionNarrativeFallback } from "../getMissionNarrativeFallback";

const portugueseOffer: JobOffer = {
  difficulty: 30,
  district: "As Docas",
  heatIncrease: 5,
  id: "offer-1",
  rewardMax: 500,
  rewardMin: 200,
  storySeed: {
    location: "um armazém nas Docas",
    premise: "Uma remessa está atrás de uma porta vigiada.",
    pressure: "A ronda chega antes do amanhecer.",
  },
  templateId: "warehouse-hijack",
  type: "roubo",
};

function node(kind: MissionNode["kind"]): MissionNode {
  return {
    choices: kind === "beat" ? [] : null,
    depth: 0,
    id: "root",
    kind,
    momentum: 0,
    narrative: null,
    narrativeStatus: "pending",
    outcomeTier: kind === "outcome" ? "successful" : null,
  };
}

describe("getMissionNarrativeFallback", () => {
  it("uses localized authored facts for a Portuguese beat", () => {
    const narrative = getMissionNarrativeFallback(
      portugueseOffer,
      node("beat"),
      "pt-BR",
    );

    expect(narrative).toEqual({
      body: "A equipe avança enquanto o plano entra em ação. Uma remessa está atrás de uma porta vigiada.",
      stakes: "A ronda chega antes do amanhecer.",
      storySummary: null,
      title: "O trabalho avança",
    });
  });

  it("provides Portuguese outcome copy for every mechanical tier", () => {
    for (const outcomeTier of OUTCOME_TIERS) {
      const outcomeNode = { ...node("outcome"), outcomeTier };
      const narrative = getMissionNarrativeFallback(
        portugueseOffer,
        outcomeNode,
        "pt-BR",
      );

      expect(narrative.title).not.toBe("");
      expect(narrative.body).not.toBe("");
      expect(narrative.storySummary).toContain(portugueseOffer.storySeed.location);
    }
  });
});
