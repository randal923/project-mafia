import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

type MessageTree = Record<string, string | MessageTree>;

const en = JSON.parse(
  readFileSync(new URL("./en.json", import.meta.url), "utf8"),
) as MessageTree;
const ptBR = JSON.parse(
  readFileSync(new URL("./pt-BR.json", import.meta.url), "utf8"),
) as MessageTree;

function registryValues(file: string, registry: string): string[] {
  const source = readFileSync(new URL(`../../../shared/${file}`, import.meta.url), "utf8");
  const body = source.match(
    new RegExp(`export const ${registry} = \\[([\\s\\S]*?)\\] as const`),
  )?.[1];
  assert.ok(body, `Could not read ${registry}`);
  return [...body.matchAll(/"([^"]+)"|(\d+)/g)].map(
    (match) => match[1] ?? match[2]!,
  );
}

function turfIds(): string[] {
  const source = readFileSync(
    new URL("../../../shared/cityMap.ts", import.meta.url),
    "utf8",
  );
  return [...source.matchAll(/"id": "([^"]+)"/g)].map((match) => match[1]!);
}

function buildingIds(): string[] {
  const source = readFileSync(
    new URL("../../../shared/buildingCatalog.ts", import.meta.url),
    "utf8",
  );
  return [...source.matchAll(/\bid:\s*"([^"]+)"/g)].map(
    (match) => match[1]!,
  );
}

function equipmentIds(): string[] {
  const equipment = JSON.parse(
    readFileSync(
      new URL(
        "../../../server/src/seedData/equipments.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as Array<{ id: string }>;

  return equipment.map(({ id }) => id);
}

function productionSourceFiles(directory: URL): URL[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) {
      return productionSourceFiles(url);
    }
    if (!/\.tsx?$/.test(entry.name) || /\.(stories|test)\.tsx?$/.test(entry.name)) {
      return [];
    }
    return [url];
  });
}

function flattenMessages(
  tree: MessageTree,
  prefix = "",
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      flattened[path] = value;
    } else {
      Object.assign(flattened, flattenMessages(value, path));
    }
  }

  return flattened;
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)[,}]/g)]
    .map((match) => match[1]!)
    .sort();
}

function assertMessage(path: string): void {
  const enMessages = flattenMessages(en);
  const ptMessages = flattenMessages(ptBR);
  assert.equal(typeof enMessages[path], "string", `Missing English ${path}`);
  assert.equal(
    typeof ptMessages[path],
    "string",
    `Missing Brazilian Portuguese ${path}`,
  );
  assert.notEqual(ptMessages[path]?.trim(), "", `Empty translation at ${path}`);
}

test("English and Brazilian Portuguese catalogs have matching shapes and placeholders", () => {
  const enMessages = flattenMessages(en);
  const ptMessages = flattenMessages(ptBR);

  assert.deepEqual(Object.keys(ptMessages).sort(), Object.keys(enMessages).sort());
  for (const [path, message] of Object.entries(enMessages)) {
    assert.deepEqual(
      placeholders(ptMessages[path]!),
      placeholders(message),
      `Placeholder mismatch at ${path}`,
    );
  }
});

test("every registered crew and domain id has catalog coverage", () => {
  for (const id of buildingIds()) {
    assertMessage(`catalog.buildings.${id}.description`);
    assertMessage(`catalog.buildings.${id}.name`);
  }
  for (const id of equipmentIds()) {
    assertMessage(`catalog.items.${id}.description`);
    assertMessage(`catalog.items.${id}.name`);
  }
  for (const id of registryValues("crew.ts", "CREW_ARCHETYPE_IDS")) {
    assertMessage(`catalog.archetypes.${id}.description`);
    assertMessage(`catalog.archetypes.${id}.name`);
    assertMessage(`catalog.crewBios.${id}`);
  }
  for (const id of registryValues("crewNames.ts", "CREW_NICKNAME_IDS")) {
    if (id !== "none") assertMessage(`catalog.nicknames.${id}`);
  }
  for (const id of registryValues("district.ts", "DISTRICT_IDS")) {
    assertMessage(`catalog.districts.${id}.description`);
    assertMessage(`catalog.districts.${id}.name`);
  }
  for (const id of registryValues("player.ts", "PLAYER_RANKS")) {
    assertMessage(`catalog.ranks.${id}`);
  }
  for (const id of registryValues("skills.ts", "SKILL_IDS")) {
    assertMessage(`catalog.skills.${id}.description`);
    assertMessage(`catalog.skills.${id}.name`);
  }
  for (const id of registryValues("crew.ts", "CREW_TIERS")) {
    assertMessage(`catalog.tiers.${id}`);
  }
  for (const id of registryValues("crew.ts", "CREW_TRAIT_IDS")) {
    assertMessage(`catalog.traits.${id}.description`);
    assertMessage(`catalog.traits.${id}.name`);
  }
  for (const id of registryValues("crew.ts", "CREW_STATUSES")) {
    assertMessage(`crew.status.${id}`);
  }
  for (const id of registryValues("crew.ts", "CREW_SLOT_IDS")) {
    assertMessage(`crew.slots.${id}`);
  }
  for (const id of registryValues("equipment.ts", "EQUIPMENT_CATEGORIES")) {
    assertMessage(`store.categories.${id}`);
  }
  for (const id of registryValues("job.ts", "JOB_APPROACHES")) {
    assertMessage(`catalog.approaches.${id}`);
  }
  for (const id of registryValues("newspaper.ts", "NEWSPAPER_SECTIONS")) {
    assertMessage(`newspaper.sections.${id}`);
  }
  for (const id of registryValues("notification.ts", "NOTIFICATION_MESSAGE_IDS")) {
    assertMessage(`notificationContent.messages.${id}.body`);
    assertMessage(`notificationContent.messages.${id}.title`);
  }
  for (const id of registryValues("notification.ts", "NOTIFICATION_TYPES")) {
    assertMessage(`notificationContent.legacy.${id}.body`);
    assertMessage(`notificationContent.legacy.${id}.title`);
  }

  const registeredTurfIds = turfIds();
  assert.equal(registeredTurfIds.length, 70);
  for (const id of registeredTurfIds) {
    assertMessage(`catalog.turfs.${id}`);
  }
});

test("localized metadata covers every production route", () => {
  const expectedPages = [
    "character",
    "crew",
    "empire",
    "home",
    "jobs",
    "loadout",
    "login",
    "map",
    "newspaper",
    "rankings",
    "store",
  ];
  const enMetadata = en.metadata as MessageTree;
  const ptMetadata = ptBR.metadata as MessageTree;

  assert.deepEqual(Object.keys(enMetadata.pages!).sort(), expectedPages);
  assert.deepEqual(Object.keys(ptMetadata.pages!).sort(), expectedPages);
});

test("production client sources do not bypass locale-aware rendering", () => {
  const forbidden = [
    { label: "hard-coded en-US locale", pattern: /["']en-US["']/ },
    { label: "direct toLocaleString call", pattern: /\.toLocaleString\(/ },
    { label: "raw equipment image alt", pattern: /alt=\{item\.image\.alt\}/ },
    { label: "raw season name", pattern: /\bseason\.name\b/ },
    { label: "raw newspaper masthead", pattern: /\bNEWSPAPER_NAME\b/ },
    {
      label: "raw Zod issue message",
      pattern: /parsed\.error\.issues[^\n]*\.message/,
    },
  ];

  for (const file of productionSourceFiles(new URL("../", import.meta.url))) {
    const source = readFileSync(file, "utf8");
    for (const guard of forbidden) {
      assert.doesNotMatch(source, guard.pattern, `${guard.label} in ${file.pathname}`);
    }
  }
});
