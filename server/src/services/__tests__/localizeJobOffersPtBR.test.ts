import { describe, expect, it } from "vitest";
import type { JobOffer } from "../../../../shared/job";
import { localizeJobOffersPtBR } from "../localizeJobOffersPtBR";

const englishOffer: JobOffer = {
  difficulty: 30,
  district: "The Docks",
  gear: [
    {
      consumes: false,
      label: "Lockpick Set",
      tags: ["lockpick"],
    },
  ],
  heatIncrease: 5,
  id: "offer-1",
  rewardMax: 500,
  rewardMin: 200,
  storySeed: {
    location: "Warehouse Row",
    premise: "A guarded shipment sits behind a locked door.",
    pressure: "The night watch arrives at ten.",
  },
  templateId: "warehouse-hijack",
  type: "hijack",
};

describe("localizeJobOffersPtBR", () => {
  it("provides a deterministic Portuguese fallback without English prose", () => {
    const [localized] = localizeJobOffersPtBR([englishOffer]);

    expect(localized?.storySeed).toEqual({
      location: "Um ponto nas Docas",
      premise:
        "Uma remessa valiosa pode ser desviada antes de chegar ao destino.",
      pressure:
        "A oportunidade dura pouco, e qualquer demora aumenta o risco.",
    });
    expect(localized?.gear?.[0]?.label).toBe("gazuas");
    expect(localized?.id).toBe(englishOffer.id);
  });

  it("omits absent optional gear instead of writing undefined", () => {
    const [localized] = localizeJobOffersPtBR([
      { ...englishOffer, gear: undefined },
    ]);

    expect(Object.hasOwn(localized ?? {}, "gear")).toBe(false);
  });
});
