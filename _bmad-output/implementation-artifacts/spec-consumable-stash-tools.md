---
title: 'Consumable Stash Tools'
type: 'feature'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e115848717983153ba369d01d4da3c96efe9ff8c'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mission tools that cannot be equipped, including Lockpick Sets, currently behave as permanent gear even though they live in the same stash-and-quantity flow as consumables. This hides their supply cost and lets one copy satisfy unlimited mission uses.

**Approach:** Make every non-equippable catalog tool single-use, stackable, reserved by exact quantity, and consumed once whenever its matched mission choice is selected. Preserve reusable behavior for exact equippable tagged items such as the Radio Scanner Belt and grandfather already-generated active mission trees.

## Boundaries & Constraints

**Always:** Enforce `category: tool` plus `slot: null` as consumable; convert the nine currently reusable tagged tools (`lockpick-set`, `crowbar`, `bolt-cutters`, `climbing-rope`, `disguise-kit`, `wiretap-kit`, `radio-scanner`, `safecracker-drill`, `signal-jammer`) while retaining already-consumable getaway keys and medical tools; make every mission requirement backed by these stash tools default to consumption; let the exact accepted match override that default when it is equippable and reusable; reserve the maximum exact quantity required by any still-possible path; spend one only when its satisfied edge is chosen, regardless of check result; reject a choice if its snapshotted stock is missing; merge legacy same-ID consumable rows and sum quantities; migrate known legacy tool copies even when old item metadata lacks category; invalidate cached job boards; show single-use status and accepted quantity consistently; preserve current prices, power, gear bonuses, penalties, chances, and rewards.

**Ask First:** Repricing tools; changing mission gear frequency, guaranteed placement, rewards, or difficulty; consuming equippable tagged gear; retroactively rebuilding or changing active mission trees; adding dependencies.

**Never:** Consume gear at job acceptance; consume a missing or unsatisfied item; let one unit satisfy two edges on the same path; sum reservations across mutually exclusive branches; treat healing or preparation items as mission gear; consume the Radio Scanner Belt or any other exact equippable match; expose future paths or rolls; apply stash power outside the existing consumed-item rule.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Lockpick use | Two Lockpick Sets; path reaches two satisfied lockpick edges | Reserve two; each selected edge removes exactly one; both checks retain accepted math | Missing exact stock rejects without advancing mission |
| Limited supply | One tool; a later same-path edge also demands it | First demand is satisfied; later demand is precomputed missing and receives the missing penalty | Never consume below zero |
| Alternate branches | Separate branches each demand one copy | Reserve one, not two; after choosing a branch, keep only remaining-subtree reservations | Unchosen branch spends nothing |
| Equippable match | Radio Scanner Belt is the strongest scanner match | Satisfies the edge without consumption despite the template fallback | Belt remains in loadout/stash |
| Legacy duplicates | Two old Lockpick Set rows with implicit quantity one | Normalize to one consumable row with quantity two | Preserve item identity and total ownership |
| Legacy active job | Stored edge snapshot says reusable | Finish under its stored reusable behavior | Do not rebuild odds, reservations, or narration |
| Store and UI | Buy five stash tools and inspect job/mission/inventory surfaces | One stack gains five; surfaces say single-use/consumed and show quantity | Reserved units cannot be sold or otherwise used |

</frozen-after-approval>

## Code Map

- `server/src/seedData/equipments.json`, `shared/equipment.ts` -- catalog flags and the future stash-tool invariant.
- `shared/player.ts` -- lazy migration of embedded player-item snapshots and duplicate consumable stacks.
- `server/missions/*.yml`, `server/missions/README.md` -- fallback consumption policy for all authored tool demands.
- `server/src/services/JobBoardService.ts` -- invalidates offers cached with reusable-tool metadata.
- `server/src/engine/{PlayerContextService,SkeletonBuilder,consumeMissionGear}.ts`, `server/src/services/MissionService.ts` -- existing exact selection, path accounting, reservations, and transactional spending.
- `client/src/components/{JobCard,MissionRunner,ItemHoverCard,Store}/*` -- consumption, quantity, and single-use presentation.

## Tasks & Acceptance

**Execution:**
- [x] `server/src/seedData/equipments.json`, `shared/equipment.ts` -- mark all stash-only tools consumable and enforce the catalog invariant.
- [x] `shared/player.ts` -- backfill known tool snapshots and coalesce duplicate consumable stash rows without changing total quantity.
- [x] `server/missions/*.yml`, `server/missions/README.md`, `server/src/services/JobBoardService.ts` -- switch 36 reusable fallbacks to consumable, document exact-match exceptions, and regenerate cached boards.
- [x] `client/src/components/MissionRunner/{MissionChoiceCard,MissionAcceptedEquipment,MissionCheckBreakdown}.tsx`, `client/src/components/MissionRunner/MissionRunnerMocks.ts`, `client/src/components/ItemHoverCard/ItemHoverCard.tsx`, stories -- show single-use tools clearly without a misleading zero-power modifier row.
- [x] `server/src/**/__tests__/*`, client fixtures/tests -- cover all catalog roles, duplicate migration, stacking, path quantities, reservations, exact spending, rollback, equippable scanner reuse, legacy active missions, projection, and narration.

**Acceptance Criteria:**
- Given any catalog tool that cannot be equipped, when catalog and player copies are audited, then it is consumable, stackable, and represented by one quantity-bearing stash row.
- Given a prepared mission path uses a tool one or more times, when choices resolve, then accepted quantities, reservations, inventory, UI, and narration agree after every edge.
- Given an exact tagged item can be equipped, when it satisfies a mission demand, then it remains reusable and contributes only through its existing equipped rules.
- Given a mission was generated before this change, when it continues, then its stored consumption and probability contract remains unchanged.

## Spec Change Log

## Design Notes

Catalog records drive new purchases, but player stashes contain embedded historical copies. Lazy normalization must therefore set the new flag by known ID and consolidate duplicate rows before engine context is built. New trees derive `consumes` from the exact strongest match: a stash Radio Scanner is spent, while a stronger Radio Scanner Belt remains reusable. Mission YAML supplies the truthful missing-item/default presentation. Deployment must reseed equipment documents; the agent must not mutate a live catalog during verification.

## Verification

**Commands:**
- `yarn --cwd server test` -- catalog, migration, path, reservation, service, prompt, and legacy scenarios pass.
- `yarn --cwd server typecheck` -- shared and server contracts compile.
- `yarn --cwd client test` -- client regressions pass.
- `yarn --cwd client tsc --noEmit --incremental false` -- item, store, job, and mission UI compile.
- `yarn --cwd client eslint src/components/ItemHoverCard src/components/JobCard src/components/MissionRunner src/components/Store` -- touched UI passes lint.

**Manual checks:**
- Reseed each deployed Firestore catalog with `yarn --cwd server seed:equipments`; do not run it against a live environment during implementation.

## Suggested Review Order

**Catalog and legacy migration**

- Coalesces historical duplicates while preserving richer metadata and safe quantities.
  [`player.ts:258`](../../shared/player.ts#L258)

- Backfills known legacy IDs and all stash-origin tool snapshots.
  [`player.ts:307`](../../shared/player.ts#L307)

- Enforces single-use stash tools and rejects consumable equippable gear.
  [`equipment.ts:114`](../../shared/equipment.ts#L114)

- Converts Lockpick Set and eight other persisted catalog records.
  [`equipments.json:1307`](../../server/src/seedData/equipments.json#L1307)

**Mission lifecycle and cached offers**

- Documents exact-match overrides and one-unit spending on selected edges.
  [`README.md:249`](../../server/missions/README.md#L249)

- Makes Lockpick Set consumption the truthful template fallback.
  [`downtown-convenience-store.yml:43`](../../server/missions/downtown-convenience-store.yml#L43)

- Invalidates cached reusable-tool offer metadata with board format four.
  [`JobBoardService.ts:16`](../../server/src/services/JobBoardService.ts#L16)

- Rejects stale offers during acceptance, closing the stale-client path.
  [`MissionService.ts:82`](../../server/src/services/MissionService.ts#L82)

**Player-facing consumption clarity**

- States that choosing a prepared tool consumes exactly one unit.
  [`MissionChoiceCard.tsx:19`](../../client/src/components/MissionRunner/MissionChoiceCard.tsx#L19)

- Separates single-use stash tools from reusable exact matches.
  [`MissionAcceptedEquipment.tsx:96`](../../client/src/components/MissionRunner/MissionAcceptedEquipment.tsx#L96)

- Hides meaningless consumed-item power rows for zero-power tools.
  [`MissionCheckBreakdown.tsx:55`](../../client/src/components/MissionRunner/MissionCheckBreakdown.tsx#L55)

- Labels consumable inventory items as single-use on hover.
  [`ItemHoverCard.tsx:98`](../../client/src/components/ItemHoverCard/ItemHoverCard.tsx#L98)

**Regression coverage**

- Proves per-path Lockpick reservations and one-unit spending.
  [`missionEquipment.test.ts:199`](../../server/src/engine/__tests__/missionEquipment.test.ts#L199)

- Exercises scanner-versus-belt selection and converted-tool stacking.
  [`equipmentCatalogRoles.test.ts:308`](../../server/src/engine/__tests__/equipmentCatalogRoles.test.ts#L308)

- Verifies current transactional spending and legacy mission grandfathering.
  [`MissionService.test.ts:153`](../../server/src/services/__tests__/MissionService.test.ts#L153)

- Audits every stash-only catalog tool and mission fallback.
  [`missionCatalog.test.ts:258`](../../server/src/engine/__tests__/missionCatalog.test.ts#L258)

**Deferred follow-ups**

- Records pre-existing concurrency, backfill, duplicate-sale, and explosive-schema concerns.
  [`deferred-work.md:16`](deferred-work.md#L16)
