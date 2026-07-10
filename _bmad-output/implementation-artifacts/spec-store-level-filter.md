---
title: 'Store level and equipment search filters'
type: 'feature'
created: '2026-07-10'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '0ad8f6e2772c046e531d143930649be8a4add5c8'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The store can be narrowed by equipment category, but players cannot browse the catalog by an item's required level or search directly for named equipment. The catalog spans many items and distinct requirement levels, so scanning every card is cumbersome.

**Approach:** Add independent, labeled equipment-name search and level controls to the existing store filters. A case-insensitive name query and the chosen exact requirement level compose with the category filter while preserving the current catalog, purchase, and lock behavior.

## Boundaries & Constraints

**Always:** Use the existing typed `Equipment.name` and `Equipment.levelRequirement` fields; provide an empty-search and "all levels" state; match trimmed equipment-name queries case-insensitively by substring; derive unique level options from the complete catalog and sort them numerically; apply search, category, and level selections together with AND semantics; keep all controls independent; label the search and level controls clearly; preserve keyboard and screen-reader access; show an informative empty state when a valid filter combination has no matches; follow the existing design system and standard Tailwind utilities.

**Ask First:** Expanding search beyond equipment names; changing the filter from exact required-level matching to ranges or player eligibility; changing the category-filter interaction; adding a dependency; extracting a shared abstraction; modifying catalog ordering or store API behavior.

**Never:** Modify shared schemas, seed data, server routes, purchase rules, or item lock rules; infer names or levels from display text; derive the available level options from another filtered subset; reset one filter when another changes; hide locked items unless they fail the selected filters.

</frozen-after-approval>

## Code Map

- `client/src/app/store/StorePageContent.tsx` -- owns catalog state, category selection, visible-item derivation, filter controls, and the store result grid.
- `client/src/components/DropdownMenu/DropdownMenu.tsx` -- existing design-system-styled, labeled native select suitable for the many available levels; no change expected.
- `client/src/components/TextInput/TextInput.tsx` -- existing labeled, focus-visible text input suitable for equipment-name search; no change expected.
- `shared/equipment.ts` -- defines the integer `Equipment.levelRequirement` field and its 1–100 bounds; no change expected.
- `server/src/services/EquipmentService.ts` -- supplies the already ordered catalog; no change expected.

## Tasks & Acceptance

**Execution:**
- [x] `client/src/app/store/StorePageContent.tsx` -- distinguish the existing category state, add typed search and `"all" | number` requirement-level state, derive unique sorted levels from the complete catalog, render labeled name-search and level controls alongside the category controls, combine all three predicates in `visibleItems`, expose category selection semantics, and render an empty-results message -- delivers the requested filters without expanding the data or API surface.

**Acceptance Criteria:**
- Given a loaded catalog with multiple requirement levels, when the store renders, then the level control offers one all-levels option followed by each unique present level in ascending numeric order.
- Given "All required levels" is selected, when a category is chosen, then every catalog item in that category remains visible regardless of its level requirement.
- Given a specific required level is selected and the category is "Everything," when results render, then only items whose `levelRequirement` exactly equals that level are visible.
- Given both a category and a specific required level are selected, when results render, then only items matching both selections are visible and neither selection changes the other control's available options.
- Given a search query with surrounding whitespace or mixed letter case, when results render, then the normalized query matches equipment names by case-insensitive substring.
- Given a name query, category, and required level are selected, when results render, then only items matching all three filters are visible and changing one control does not reset either of the others.
- Given the selected filters have no intersection, when results render, then the store shows an explanatory empty state instead of a blank grid.
- Given a keyboard or screen-reader user operates the filters, when focus or selection changes, then the search input and level select have explicit labels and visible focus treatments, and each category button exposes its pressed state with a visible keyboard focus treatment.
- Given a filtered item is locked, affordable, owned, or busy, when it renders, then its existing card state and purchase behavior remain unchanged.

## Spec Change Log

## Verification

**Commands:**
- `yarn --cwd client lint` -- expected: the updated store passes ESLint with no new warnings or errors.
- `yarn --cwd client test` -- expected: the existing client test suite remains green.
- `yarn --cwd client build` -- expected: Next.js production compilation and TypeScript validation succeed.
