---
title: 'Complete Portuguese localization'
type: 'bugfix'
created: '2026-07-12'
status: 'done'
baseline_commit: 'a210f611d93059a816283e07bd2752251d94efac'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Brazilian Portuguese mode still exposes English throughout crew, domain catalogs, server errors, persisted/generated prose, metadata, accessibility text, and locale-sensitive formatting. The most visible crew defect is a silent fallback: `useCatalogText` requests six catalog namespaces that neither locale file contains.

**Approach:** Complete the typed translation catalogs and make every player-facing value locale-aware from first server render through API and persisted content. Use stable semantic IDs/codes for server-originated text, deterministic Portuguese fallbacks when AI is unavailable, and locale-tagged or bilingual cached content where prose must persist.

## Boundaries & Constraints

**Always:** Preserve fully working English and Portuguese modes; derive locale from the saved preference/cookie or request language; keep ICU parameters and typed domain IDs aligned between catalogs; localize visible text, accessibility names, metadata, dates, times, numbers, and currency; return safe generic localized copy for internal failures while logging details server-side; use Yarn and existing dependencies only.

**Ask First:** Any destructive migration or deletion of existing player, mission, notification, recruitment, or newspaper data.

**Never:** Translate machine identifiers, API routes, error codes, HTTP values, code comments/logs, AI prompt instructions, tests' developer descriptions, model/brand names such as `Project Mafia` and `BAR M1918`, or Storybook-only demo prose. Never use an English string as control flow or expose raw Zod/internal exception text to players.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| First Portuguese visit | `Accept-Language: pt-BR`, no saved preference | Portuguese SSR/first paint, `<html lang="pt-BR">`, metadata, UI, and formatters | Unsupported locales fall back to English |
| Locale switch | Existing English session/cache switches to Portuguese | Static and cached/generated content no longer renders English; safe caches regenerate or select Portuguese variants | Legacy unstructured prose uses a Portuguese semantic fallback, never raw English |
| API failure | Portuguese request hits auth, validation, domain, 404, or 500 failure | Response contains a stable code and natural Portuguese message; UI displays it | Internal details remain server-only |
| AI unavailable | Portuguese job board, crew pool, mission fallback, or newspaper generation | Deterministic authored Portuguese copy is returned | Do not fall back to English |
| English mode | Locale is `en` | Existing English wording and behavior remain intact | Codes/data shapes remain locale-independent |

</frozen-after-approval>

## Code Map

- `client/src/messages/{en,pt-BR}.json` -- canonical UI/domain catalogs.
- `client/src/components/LanguageProvider/LanguageProvider.tsx`, `client/src/app/layout.tsx`, `client/src/app/*/page.tsx` -- initial locale, document language, and metadata.
- `client/src/lib/api.ts`, `server/src/middleware/{authenticate,errorHandler}.ts` -- request locale and localized API error boundary.
- `shared/{language,crew,crewNames,notification,newspaper,cityMap,gameTime}.ts` -- cross-layer locale-aware contracts and stable content IDs.
- `server/src/services/{RecruitmentService,JobBoardService,NotificationService,NewspaperService,WorldEventService,MissionService,SeasonService}.ts` -- generated and persisted player-facing prose.
- `server/src/{controllers,services}/**/*.ts` -- user-reachable `HttpError` producers.
- `client/src/{app,components}/**/*.tsx` -- rendered text, accessibility names, and formatting consumers.

## Tasks & Acceptance

**Execution:**
- [x] `client/src/messages/{en,pt-BR}.json`, `client/src/lib/useCatalogText.ts` -- add complete archetype, district, rank, skill, tier, trait, approach, turf, newspaper, season, clock, notification, error, metadata, and framework-state messages; remove registered-content English fallbacks.
- [x] `shared/{language,crew,crewNames,notification,newspaper,cityMap,gameTime}.ts` -- introduce the minimum typed locale/content contracts needed for bilingual cached prose, semantic notifications, translated nicknames/turfs, and non-string clock/season rendering.
- [x] `client/src/components/LanguageProvider/LanguageProvider.tsx`, `client/src/app/layout.tsx`, `client/src/app/*/page.tsx`, `client/src/app/{error,global-error,not-found}.tsx` -- make SSR, metadata, document language, and framework fallbacks honor the initial locale without an English flash.
- [x] `client/src/lib/api.ts`, `server/src/middleware/{authenticate,errorHandler}.ts`, `server/src/controllers/*.ts`, `server/src/services/{AttackService,BuildingService,CrewService,LoadoutService,MissionService,PlayerService,PrisonService,RecruitmentService,StoreService,TerritoryService}.ts` -- forward locale, replace raw messages with typed stable error codes/parameters, localize responses, and preserve `still_generating` as a code.
- [x] `server/src/services/{RecruitmentService,JobBoardService,NotificationService,NewspaperService,WorldEventService,MissionService,SeasonService,SeasonTickService,AttackService,CrewService,TerritoryService}.ts`, `server/missions/*.yml` -- supply Portuguese authored/generated content and deterministic fallbacks; invalidate or select caches by locale; keep persisted notifications/newspaper copy switchable.
- [x] `client/src/app/{crew,map,empire,jobs,newspaper,rankings,store}/**/*`, `client/src/components/{Crew,CityMap,Inventory,ItemHoverCard,MissionRunner,NotificationsBell,PrisonPanel,Store,StreetStatus,CharacterStats}/**/*` -- render translated domain/server content, localized item alt text, and active-locale formatters instead of raw labels or `en-US`.
- [x] `client/src/messages/translationCatalog.test.ts`, `server/src/**/__tests__/*` -- cover locale shape/placeholders, every registered domain ID, Portuguese error categories, AI-failure fallbacks, cache switching, semantic notifications, and bilingual newspaper output.

**Acceptance Criteria:**
- [x] Given Portuguese mode, when every production page and representative empty, loading, success, failure, modal, toast, notification, prison, crew, mission, map, newspaper, and framework-error state is rendered, then no English player-facing text remains except approved proper/model/brand names.
- [x] Given any typed catalog registry, when locale coverage tests run, then both catalogs contain every ID with matching ICU parameters and no known Portuguese lookup reaches an English fallback.
- [x] Given the static audits, when production sources are scanned, then no raw user-facing Zod issue, language-dependent error comparison, direct server prose field, hard-coded `en-US`, or raw equipment `image.alt` remains on Portuguese render paths.

## Spec Change Log

## Design Notes

Use semantic data at persistence boundaries: error and notification codes plus typed parameters, and per-locale variants for genuinely authored prose such as newspapers. This keeps language switching deterministic and avoids translating by matching English sentences. Legacy records may retain old fields for compatibility, but Portuguese render paths must select structured content or a truthful Portuguese fallback.

## Verification

**Commands:**
- `yarn --cwd client lint && yarn --cwd client test && yarn --cwd client build && yarn --cwd client build-storybook` -- all client/static/Storybook checks pass.
- `yarn --cwd server typecheck && yarn --cwd server test && yarn --cwd server build` -- all server checks pass.
- `rg -n '"en-US"|parsed\.error\.issues.*message|error\.message ===|notification\.(title|body)|prison\.reason|season\.name|turf\.name|image\.alt' client/src server/src` -- only reviewed internal/compatibility allowlist matches remain.

## Suggested Review Order

**Locale source and catalog**

- Coordinates SSR locale, optimistic switching, persistence ordering, and legacy preference migration.
  [`LanguageProvider.tsx:50`](../../client/src/components/LanguageProvider/LanguageProvider.tsx#L50)

- Seeds document language and translation context from the request before first render.
  [`layout.tsx:17`](../../client/src/app/layout.tsx#L17)

- Holds the complete Brazilian Portuguese UI, crew, domain, error, and metadata catalog.
  [`pt-BR.json:39`](../../client/src/messages/pt-BR.json#L39)

- Resolves stable domain IDs while preventing unknown persisted values from leaking English.
  [`useCatalogText.ts:23`](../../client/src/lib/useCatalogText.ts#L23)

- Localizes crew archetypes, traits, statuses, tiers, names, and biographies consistently.
  [`useCrewText.ts:17`](../../client/src/lib/useCrewText.ts#L17)

- Centralizes active-locale number, currency, and date formatting.
  [`useFormatters.ts:6`](../../client/src/lib/useFormatters.ts#L6)

**API and server errors**

- Sends request locale and accepts server prose only alongside a trusted error code.
  [`api.ts:41`](../../client/src/lib/api.ts#L41)

- Defines the typed, locale-independent error descriptor contract shared across layers.
  [`apiError.ts:125`](../../shared/apiError.ts#L125)

- Converts every descriptor into safe English or Brazilian Portuguese server copy.
  [`formatApiError.ts:209`](../../server/src/errors/formatApiError.ts#L209)

- Localizes 404, typed failures, and sanitized internal errors at one HTTP boundary.
  [`errorHandler.ts:8`](../../server/src/middleware/errorHandler.ts#L8)

**Generated and persisted prose**

- Tags recruitment bios by locale and rejects stale or wrong-language candidate pools.
  [`RecruitmentService.ts:55`](../../server/src/services/RecruitmentService.ts#L55)

- Generates locale-tagged boards with deterministic Portuguese fallbacks and language validation.
  [`JobBoardService.ts:33`](../../server/src/services/JobBoardService.ts#L33)

- Freezes mission locale, preserves per-language story history, and localizes narration fallbacks.
  [`MissionService.ts:63`](../../server/src/services/MissionService.ts#L63)

- Rejects valid-shaped English model output before Portuguese prose can be persisted.
  [`isLikelyPortugueseText.ts:69`](../../server/src/services/isLikelyPortugueseText.ts#L69)

- Publishes bilingual editions while retaining truthful structured Portuguese fallbacks.
  [`NewspaperService.ts:46`](../../server/src/services/NewspaperService.ts#L46)

- Replaces persisted notification sentences with stable message IDs and typed parameters.
  [`notification.ts:21`](../../shared/notification.ts#L21)

**Rendering and regression coverage**

- Selects bilingual newspaper copy and masks legacy English archives in Portuguese.
  [`selectNewspaperCopy.ts:9`](../../client/src/lib/selectNewspaperCopy.ts#L9)

- Reconstructs localized notification copy from semantic server data.
  [`formatNotificationText.ts:31`](../../client/src/lib/formatNotificationText.ts#L31)

- Enforces matching catalogs, placeholders, every registry ID, metadata, and source guards.
  [`translationCatalog.test.ts:106`](../../client/src/messages/translationCatalog.test.ts#L106)

- Exercises bilingual editions and every structured Portuguese newspaper event fallback.
  [`NewspaperService.test.ts:45`](../../server/src/services/__tests__/NewspaperService.test.ts#L45)
