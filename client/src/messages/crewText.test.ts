import assert from "node:assert/strict";
import test from "node:test";
import { formatCrewBio } from "../lib/formatCrewBio.ts";
import { formatCrewNameForLocale } from "../lib/formatCrewNameForLocale.ts";

test("crew biographies never cross locale boundaries", () => {
  const member = {
    archetype: "ghost" as const,
    bio: "Walked out of a locked evidence room.",
    bioLanguage: "en" as const,
  };

  assert.equal(formatCrewBio(member, "en", () => "fallback"), member.bio);
  assert.equal(
    formatCrewBio(member, "pt-BR", () => "Nunca deixa rastros."),
    "Nunca deixa rastros.",
  );
  assert.equal(
    formatCrewBio(
      { archetype: "ghost", bio: member.bio },
      "pt-BR",
      () => "Legado localizado.",
    ),
    "Legado localizado.",
  );
});

test("crew nicknames translate without changing proper names", () => {
  assert.equal(
    formatCrewNameForLocale(
      'Vito "the Ghost" Moretti',
      (id) => (id === "ghost" ? "o Fantasma" : id),
    ),
    'Vito "o Fantasma" Moretti',
  );
  assert.equal(
    formatCrewNameForLocale("Vito Moretti", (id) => id),
    "Vito Moretti",
  );
});
