import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  NewspaperClassified,
  NewspaperEdition,
} from "../../../shared/newspaper.ts";
import type { PlayerLanguage } from "../../../shared/language.ts";
import { formatNewspaperClassified } from "../lib/formatNewspaperClassified.ts";
import { selectNewspaperCopy } from "../lib/selectNewspaperCopy.ts";

type MessageTree = Record<string, string | MessageTree>;
type TranslationValues = Record<string, number | string>;

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
    const path = `newspaper.${key}`.split(".");
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

const edition = {
  articles: [
    { body: "English article", section: "war_report", title: "English news" },
  ],
  classifieds: [],
  gameDay: 12,
  headline: {
    body: "English headline body",
    section: "front_page",
    title: "English headline",
  },
  id: "edition-1",
  mastheadChampion: null,
  ptBR: {
    articles: [
      {
        body: "Matéria em português",
        section: "war_report",
        title: "Notícia em português",
      },
    ],
    headline: {
      body: "Texto principal em português",
      section: "front_page",
      title: "Manchete em português",
    },
  },
  publishedAt: "2026-07-12T00:00:00.000Z",
  seasonId: "season-1",
  standings: [],
} satisfies NewspaperEdition;

test("newspaper copy selection follows the active locale", () => {
  assert.equal(
    selectNewspaperCopy(edition, "en", translator("en")).headline.title,
    "English headline",
  );
  assert.equal(
    selectNewspaperCopy(edition, "pt-BR", translator("pt-BR")).headline
      .title,
    "Manchete em português",
  );
});

test("legacy Portuguese editions use localized archive copy", () => {
  const legacyEdition = { ...edition, ptBR: undefined };
  const portuguese = selectNewspaperCopy(
    legacyEdition,
    "pt-BR",
    translator("pt-BR"),
  );

  assert.equal(portuguese.headline.title, "Do arquivo do dia 12");
  assert.equal(portuguese.articles[0]?.title, "Edição arquivada");
  assert.doesNotMatch(JSON.stringify(portuguese), /English/);
  assert.equal(
    selectNewspaperCopy(legacyEdition, "en", translator("en")).headline.title,
    "English headline",
  );
});

test("classifieds ignore persisted prose and render semantically", () => {
  const bounty = {
    bounty: 1_000,
    targetName: "Vale",
    targetUid: "target-1",
    text: "RAW ENGLISH CLASSIFIED",
    type: "bounty",
  } satisfies NewspaperClassified;

  const englishFormatters = {
    date: () => "July 13, 2026",
    district: () => "Downtown",
    item: () => "Lockpick Set",
    money: () => "$1,000",
    number: (amount: number) => String(amount),
  };
  assert.equal(
    formatNewspaperClassified(bounty, englishFormatters, translator("en")),
    "Concerned citizens offer $1,000 to anyone who takes a block from the Vale family. Discretion guaranteed.",
  );
  const portuguese = formatNewspaperClassified(
    bounty,
    { ...englishFormatters, money: () => "US$ 1.000" },
    translator("pt-BR"),
  );
  assert.equal(
    portuguese,
    "Cidadãos preocupados oferecem US$ 1.000 a quem tomar um quarteirão da família Vale. Discrição garantida.",
  );
  assert.doesNotMatch(portuguese, /RAW ENGLISH/);

  const modifier = {
    district: "downtown",
    heatFactor: 0.75,
    payoutFactor: 1.5,
    text: "RAW ENGLISH MODIFIER",
    type: "mission_modifier",
    until: "2026-07-13T00:00:00.000Z",
  } satisfies NewspaperClassified;
  assert.equal(
    formatNewspaperClassified(
      modifier,
      {
        ...englishFormatters,
        date: () => "13 de julho de 2026",
        district: () => "Centro",
      },
      translator("pt-BR"),
    ),
    "Trabalhos em Centro: pagamentos ×1.5, pressão ×0.75 até 13 de julho de 2026.",
  );

  const storeDrop = {
    equipmentId: "lockpick-set",
    priceFactor: 0.8,
    text: "RAW ENGLISH DROP",
    type: "store_drop",
    until: "2026-07-13T00:00:00.000Z",
  } satisfies NewspaperClassified;
  assert.equal(
    formatNewspaperClassified(storeDrop, englishFormatters, translator("en")),
    "Lockpick Set: 20% off until July 13, 2026.",
  );
});
