import { describe, expect, it } from "vitest";
import { playerLanguageFromHeader } from "../../../../shared/playerLanguageFromHeader";

describe("playerLanguageFromHeader", () => {
  it("selects supported language families by quality", () => {
    expect(
      playerLanguageFromHeader("en-US;q=0.4, pt-BR;q=0.9"),
    ).toBe("pt-BR");
  });

  it("ignores tags that only begin with a supported language name", () => {
    expect(playerLanguageFromHeader("ptpirate", "en")).toBe("en");
    expect(playerLanguageFromHeader("english", "pt-BR")).toBe("pt-BR");
  });
});
