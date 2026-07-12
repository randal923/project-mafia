import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { PlayerNotification } from "../../../shared/notification.ts";
import type { PlayerLanguage } from "../../../shared/language.ts";
import { formatNotificationText } from "../lib/formatNotificationText.ts";

type MessageTree = Record<string, string | MessageTree>;
type TranslationValues = {
  attackerName?: string;
  building?: string;
  heat?: number;
  name?: string;
  turf?: string;
};

const messages: Record<PlayerLanguage, MessageTree> = {
  en: JSON.parse(
    readFileSync(new URL("./en.json", import.meta.url), "utf8"),
  ) as MessageTree,
  "pt-BR": JSON.parse(
    readFileSync(new URL("./pt-BR.json", import.meta.url), "utf8"),
  ) as MessageTree,
};

function translator(language: PlayerLanguage) {
  return (key: string, values?: TranslationValues): string => {
    const path = `notificationContent.${key}`.split(".");
    let current: string | MessageTree = messages[language];
    for (const segment of path) {
      assert.notEqual(typeof current, "string", `Missing ${key}`);
      current = (current as MessageTree)[segment]!;
    }
    assert.equal(typeof current, "string", `Missing ${key}`);

    let rendered = current as string;
    for (const [name, value] of Object.entries(values ?? {})) {
      rendered = rendered.replaceAll(`{${name}}`, String(value));
    }
    return rendered;
  };
}

const base = {
  createdAt: "2026-07-12T00:00:00.000Z",
  id: "notification-1",
  read: false,
  refId: null,
} as const;

test("semantic notifications render parameters in both locales", () => {
  const seasonNotification = {
    ...base,
    content: {
      messageId: "season_crackdown",
      params: { heat: 20 },
    },
    type: "season",
  } satisfies PlayerNotification;
  const turfNotification = {
    ...base,
    content: {
      messageId: "turf_lost",
      params: { attackerName: "Família Vale", turfId: "the-docks-01" },
    },
    type: "turf_lost",
  } satisfies PlayerNotification;

  assert.deepEqual(
    formatNotificationText(seasonNotification, {
      buildingName: (id) => id,
      crewName: (name) => name,
      language: "en",
      translate: translator("en"),
      turfName: (id) => id,
    }),
    {
      body: "A week of open warfare made your family the precinct's main target. Heat increased by 20.",
      title: "The city is cracking down on you",
    },
  );
  assert.deepEqual(
    formatNotificationText(turfNotification, {
      buildingName: (id) => id,
      crewName: (name) => name,
      language: "pt-BR",
      translate: translator("pt-BR"),
      turfName: () => "Cais Treze",
    }),
    {
      body: "Família Vale tomou Cais Treze. Você tem 24 horas de revanche para atacar qualquer território dessa família.",
      title: "Você perdeu Cais Treze",
    },
  );
});

test("legacy English keeps detail while Portuguese uses a localized fallback", () => {
  const legacy = {
    ...base,
    body: "English detail from an old record.",
    title: "Old English title",
    type: "crew_died",
  } satisfies PlayerNotification;

  assert.deepEqual(
    formatNotificationText(legacy, {
      buildingName: (id) => id,
      crewName: (name) => name,
      language: "en",
      translate: translator("en"),
      turfName: (id) => id,
    }),
    { body: legacy.body, title: legacy.title },
  );
  assert.deepEqual(
    formatNotificationText(legacy, {
      buildingName: (id) => id,
      crewName: (name) => name,
      language: "pt-BR",
      translate: translator("pt-BR"),
      turfName: (id) => id,
    }),
    {
      body: "Um membro da sua equipe morreu.",
      title: "Baixa na equipe",
    },
  );
});
