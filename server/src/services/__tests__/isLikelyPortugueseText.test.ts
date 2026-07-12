import { describe, expect, it } from "vitest";
import { isLikelyPortugueseText } from "../isLikelyPortugueseText";

describe("isLikelyPortugueseText", () => {
  it("accepts natural Brazilian Portuguese prose", () => {
    expect(
      isLikelyPortugueseText({
        body: "A família assumiu o território depois do trabalho.",
        title: "Controle da cidade muda de mãos",
      }),
    ).toBe(true);
  });

  it("rejects valid-shaped English prose", () => {
    expect(
      isLikelyPortugueseText({
        body: "The family took the territory after the job.",
        title: "Control of the city changes hands",
      }),
    ).toBe(false);
  });
});
