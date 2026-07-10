---
title: 'Character and Loadout Page Split'
type: 'feature'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'b5665d73946921f8b094657652301e046f9e4728'
context:
  - '{project-root}/docs/design-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Character identity, player stats, equipped gear, and stash inventory currently compete for space behind nested tabs on one route. The player needs a clear distinction between reading their character state and actively managing equipment.

**Approach:** Keep `/character` as a tab-free dossier containing a compact portrait plus clearly separated overview, progression, and skills regions, and introduce `/loadout` for equipped slots and stash management. Take structural inspiration from Escape from Tarkov's loadout screen through simultaneous, equal-height gear and storage regions, three slot-filled stash tabs, bidirectional drag-and-drop, and an original transparent gangster silhouette behind the gear map, while retaining Project Mafia's current components and brass-and-black visual system.

## Boundaries & Constraints

**Always:** Keep portrait and all player stats visible together and clearly grouped on Character with standard `gap-4` spacing; keep equipped slots and stash visible together on Loadout; make the wide loadout and stash panels equal height; keep each loadout or stash slot the same size whether empty or occupied by reserving its command area; provide three keyboard-accessible stash tabs with a full bank of slots on each and keep every owned item reachable; allow equippable stash items to drag to loadout and equipped items to drag back to stash while retaining Equip/Unequip as keyboard and touch fallbacks; apply equip/unequip swaps to the UI immediately, replace optimistic state with the server result on success, and restore the exact captured player state on failure; place an original alpha-transparent gangster silhouette across the full available loadout-panel body behind a compact gear-slot map without obstructing controls; add Loadout to primary navigation with correct active-page semantics; preserve the existing API flows, mutation lock, failure toast, item cards, slot layout, and empty states; use responsive layouts that become a single readable column on narrow screens; use existing design tokens and standard Tailwind utilities.

**Ask First:** Any inventory interaction beyond the approved bidirectional dragging, new slot type, additional character artwork, gameplay rule, or broad redesign of shared navigation or equipment components beyond what the two-route layout needs.

**Never:** Copy Escape from Tarkov artwork, branding, terminology, or exact presentation; make drag-and-drop the only way to move gear; add dependencies, duplicated inventory state, arbitrary-value styling where a token fits, or changes to server/shared contracts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Character loaded | A valid player visits `/character` | Compact portrait, Overview, Progression, and Skills appear together without tabs or inventory controls | N/A |
| Loadout loaded | A valid player visits `/loadout` | Equal-height equipped and stash panels appear together; three stash tabs expose full slot banks and all eligible item commands | N/A |
| Player pending | Provider status is `loading` or `missing` on either route | Route-appropriate centered loading feedback appears | No partial character or inventory surface renders |
| Player unavailable | Provider status is `error` or player is absent | Route-appropriate failure feedback appears | No unsafe player access occurs |
| Inventory mutation fails | Equip, unequip, use, or sell rejects on Loadout | Existing failure toast appears and displayed inventory remains intact | Mutation lock clears so the player can retry |
| Gear dragged | An eligible stash item is dropped on loadout, or equipped gear is dropped on stash | The existing equip or unequip mutation runs once and buttons remain available | Invalid or disabled drags do not mutate player state |
| Optimistic gear swap fails | A hand slot contains a knife and equipping a stashed gun is rejected | Gun appears in hand and knife in stash immediately, then gun returns to stash and knife returns to hand | Failure toast remains visible after exact rollback |

</frozen-after-approval>

## Code Map

- `client/src/components/AppShell/AppShell.tsx` -- primary route definitions and active navigation state.
- `client/src/app/character/CharacterPageContent.tsx` -- current mixed character/inventory route and all inventory mutation wiring.
- `client/src/components/CharacterStats/CharacterStats.tsx` -- identity/stat panel with inner Overview/Skills tabs.
- `client/src/components/CharacterStats/CharacterStatsSkills.tsx` -- progression and skill-meter grouping within the stat panel.
- `client/src/components/CharacterStats/CharacterStats.stories.tsx` -- stories exposing the current tab-only API.
- `client/src/components/Inventory/Inventory.tsx` -- existing loadout slot map, stash grid, and inventory commands.
- `client/src/components/Inventory/InventoryItemCard.tsx` -- visual item surface that can expose native drag affordances.
- `client/src/components/Inventory/InventorySlotPanel.tsx` -- equipped-slot surface that initiates loadout-to-stash drags.
- `client/src/components/Inventory/Inventory.stories.tsx` -- reusable inventory states and layout coverage.
- `client/public/images/characters/gangster-loadout-silhouette.png` -- original alpha-transparent background figure for the gear map.
- `client/src/app/loadout/LoadoutPageContent.tsx` -- new client route content that will own inventory data mutations.
- `client/src/app/loadout/runOptimisticLoadoutMutation.ts` -- feature-local optimistic equip/unequip transaction and rollback logic.
- `client/src/app/loadout/runOptimisticLoadoutMutation.test.ts` -- pending-request replacement and failure-rollback regression coverage.
- `client/package.json` and `client/tsconfig.json` -- dependency-free TypeScript test command and `.ts` test import support.
- `client/src/app/loadout/page.tsx` -- new route metadata and page entry point.

## Tasks & Acceptance

**Execution:**
- [x] `client/src/components/AppShell/AppShell.tsx` -- add the Loadout route to primary navigation while retaining Character as a separate destination.
- [x] `client/src/app/character/CharacterPageContent.tsx` -- remove tabs and inventory responsibilities; render only a compact portrait and the complete player-stat surface with existing loading/error states and `gap-4` spacing.
- [x] `client/src/components/CharacterStats/CharacterStats.tsx` -- remove the tab state/API and render overview, progression, and skills concurrently as clear full-width sections that avoid cramped labels and meters.
- [x] `client/src/components/CharacterStats/CharacterStats.stories.tsx` -- remove obsolete tab args and retain fresh and established combined-stat examples.
- [x] `client/src/app/loadout/LoadoutPageContent.tsx` and `client/src/app/loadout/page.tsx` -- move the existing inventory mutation flow into a dedicated Loadout route and provide route metadata.
- [x] `client/src/app/loadout/runOptimisticLoadoutMutation.ts`, `client/src/app/loadout/runOptimisticLoadoutMutation.test.ts`, `client/src/app/loadout/LoadoutPageContent.tsx`, `client/package.json`, and `client/tsconfig.json` -- optimistically mirror server equip/unequip swaps, confirm from the server, roll back the captured player on failure, and cover a rejected gun-for-knife hand replacement with the dependency-free TypeScript test command.
- [x] `client/src/components/Inventory/Inventory.tsx`, `client/src/components/Inventory/InventoryItemCard.tsx`, and `client/src/components/Inventory/InventorySlotPanel.tsx` -- retain equal-height tabbed panels, normalize empty/occupied slot footprints, compact the equipment slots around the transparent silhouette, and add typed bidirectional drag-and-drop that calls the existing equip/unequip commands while preserving buttons.
- [x] `client/public/images/characters/gangster-loadout-silhouette.png` -- add and validate an original transparent-background silhouette asset for the loadout slot map.
- [x] `client/src/components/Inventory/Inventory.stories.tsx` -- add a combined tabbed loadout-workspace story while preserving existing empty and isolated states.

**Acceptance Criteria:**
- Given an authenticated player, when they use primary navigation, then distinct Character and Loadout destinations are keyboard reachable and each reports the correct active page.
- Given `/character`, when the page renders at any supported width, then the compact portrait precedes or sits beside Overview and Skills, and no character or inventory tabs are present.
- Given `/loadout` at a wide viewport, when the page renders, then the equipped body-slot map and stash form adjacent, equal-height work regions inspired by a game inventory screen.
- Given any stash tab, when the player selects it by pointer or keyboard, then that tab exposes a complete bank of slots and owned items remain reachable across the three tabs.
- Given an eligible item is dragged between stash and loadout, when it is dropped on the opposite region, then the matching existing mutation runs once and native buttons remain usable.
- Given an equip or unequip request is pending, when its command begins, then the corresponding slot/stash swap is visible before the request settles.
- Given an optimistic replacement fails, when rollback completes, then every displaced and attempted item returns to its exact pre-command location and the error toast appears.
- Given the loadout slot map renders, when no gear covers its center, then an original low-contrast gangster silhouette is visible behind the slots with no opaque background or blocked pointer targets.
- Given any loadout or stash slot, when its state changes between empty and occupied, then its dimensions remain unchanged and neighboring slots do not shift.
- Given `/loadout` at a narrow viewport, when the page renders, then loadout precedes stash in one column without horizontal overflow or obscured commands.
- Given an existing inventory command, when it resolves, then player state and disabled/error behavior match the original character-page flow.
- Given the updated reusable stories, when TypeScript compiles them, then combined stats and the two-region loadout workspace are represented without obsolete tab props.

## Spec Change Log

- 2026-07-10 -- Human review redirected the approved single-page dossier into separate Character and Loadout routes. The plan now avoids mixing passive stats with active gear management. KEEP: tab-free stat visibility, compact portrait, existing inventory actions/components, and Project Mafia styling.
- 2026-07-10 -- Human visual review requested equal-height loadout/stash panels, two additional slot-filled stash tabs, and a clearer stat hierarchy. KEEP: the two-route split, current visual system, and all existing inventory behavior.
- 2026-07-10 -- Human visual review requested a transparent gangster silhouette behind the gear slots, tighter `gap-4` character spacing, and drag-and-drop in both inventory directions. KEEP: all button fallbacks, existing API mutations, tabbed stash, and original Project Mafia styling.
- 2026-07-10 -- Human visual review requested smaller loadout slots so the background silhouette reads more clearly. KEEP: slot positions, item readability, drag targets, and Unequip controls.
- 2026-07-10 -- Human visual review required empty and occupied loadout/stash slots to keep identical dimensions. KEEP: item aspect ratios, command buttons, and responsive column counts.
- 2026-07-10 -- Human visual review required the silhouette to span the full stretched loadout body instead of being constrained to the smaller slot grid. KEEP: compact overlaid slots, low contrast, and transparent background.
- 2026-07-10 -- Human requested optimistic drag/drop with exact rollback and a regression test for a rejected gun replacing a hand-slot knife. KEEP: server-authoritative success responses, mutation locking, and failure toast.

## Design Notes

The Tarkov reference informs information architecture only: on wide screens Loadout reads as `[equipped slot map over subtle silhouette] [three-page stash]`, with equal-height regions that stay persistent and dense; on smaller screens those same regions stack in that order. Character reads as `[compact portrait] [overview, progression, skills]`, separated by `gap-4`, with the stats arranged vertically enough to keep labels and values from colliding. The portrait does not move into Loadout, and the existing Project Mafia panel headers, borders, item art, type, colors, and button interactions remain authoritative.

## Verification

**Commands:**
- `yarn --cwd client test` -- expected: optimistic replacement is visible before settlement and exact knife/gun placement is restored after rejection.
- `yarn --cwd client eslint src/app/character/CharacterPageContent.tsx src/app/loadout/LoadoutPageContent.tsx src/app/loadout/page.tsx src/app/loadout/runOptimisticLoadoutMutation.ts src/app/loadout/runOptimisticLoadoutMutation.test.ts src/components/AppShell/AppShell.tsx src/components/CharacterStats/CharacterStats.tsx src/components/CharacterStats/CharacterStatsSkills.tsx src/components/CharacterStats/CharacterStats.stories.tsx src/components/Inventory/Inventory.tsx src/components/Inventory/InventoryItemCard.tsx src/components/Inventory/InventorySlotPanel.tsx src/components/Inventory/Inventory.stories.tsx` -- expected: touched files pass ESLint.
- `yarn --cwd client tsc --noEmit --incremental false` -- expected: application and Storybook TypeScript compile without errors without updating the tracked incremental cache.

**Manual checks (if no CLI):**
- Inspect Character and Loadout at narrow and wide breakpoints for the intended region split, complete headings, correct navigation state, stable empty/occupied slot dimensions, full-height transparent silhouette, readable controls, tab arrow-key behavior, and page-level tab absence.

## Suggested Review Order

1. [LoadoutPageContent.tsx](../../client/src/app/loadout/LoadoutPageContent.tsx#L62) — Route orchestration, mutation locking, and optimistic command wiring.
2. [runOptimisticLoadoutMutation.ts](../../client/src/app/loadout/runOptimisticLoadoutMutation.ts#L28) — Exact equip/unequip projections and rollback behavior.
3. [Inventory.tsx](../../client/src/components/Inventory/Inventory.tsx#L67) — Two-panel layout, stash pages, silhouette, and drag/drop interactions.
4. [InventorySlotPanel.tsx](../../client/src/components/Inventory/InventorySlotPanel.tsx#L23) — Compact fixed-size equipped slots and button fallback.
5. [CharacterPageContent.tsx](../../client/src/app/character/CharacterPageContent.tsx#L31) — Compact portrait and stats-only character route.
6. [CharacterStats.tsx](../../client/src/components/CharacterStats/CharacterStats.tsx#L25) — Concurrent overview, progression, and skills organization.
7. [AppShell.tsx](../../client/src/components/AppShell/AppShell.tsx#L13) — Separate Character and Loadout navigation destinations.
8. [runOptimisticLoadoutMutation.test.ts](../../client/src/app/loadout/runOptimisticLoadoutMutation.test.ts#L66) — Immediate swap and rejected gun-for-knife rollback coverage.
