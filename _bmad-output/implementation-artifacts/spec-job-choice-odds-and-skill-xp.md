---
title: 'Job Choice Odds and Skill Experience'
type: 'feature'
created: '2026-07-10'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: '685ce1fd9ae3909998ced76063f47e854b9c4154'
context:
  - '{project-root}/docs/design-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Job choices hide the concrete skill roll, success/failure odds, and skill-experience reward behind narrative hints. The mission outcome also omits the skill XP actually earned along the chosen path.

**Approach:** Turn each option into a compact tactical readout that keeps its narrative action prominent while showing the checked skill, difficulty, server-calculated success and failure percentages, success/critical skill XP, and equipment readiness. Aggregate the actual XP awarded by skill into the resolved mission and display it beside the existing cash, heat, and player XP rewards.

## Boundaries & Constraints

**Always:** Use the mission's accept-time `passChance`, which already includes skill, power, heat, intoxication, loadout bonuses, armor, and required-gear modifiers; derive failure chance as `100 - passChance`; show the checked skill independently of AI-generated risk copy; show normal and critical-success skill XP without implying failed checks award XP; show equipment on every option as ready, missing, consumed on use, or not required; make clear that displayed odds include the equipment state; aggregate only XP actually awarded on the selected path, grouped by skill; preserve the current narrative, choice lock, and Project Mafia visual language; retain older-mission compatibility when skill-XP summary data is absent.

**Ask First:** Any change to probability, XP, critical, equipment-consumption, or mission-generation rules; revealing a future roll value/result; adding equipment progression; changing job reward balance.

**Never:** Recalculate authoritative odds in the browser; expose the pre-rolled value, pass/fail result, margin, future branch, or momentum delta; represent equipment as earning XP; add dependencies or replace narrative choice labels with raw statistics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Standard choice | Skill check with a 63% pass chance | Show skill, difficulty, `63% success`, `37% failure`, and success/critical skill XP | Hidden roll data never reaches the client |
| Required gear | Choice requires available or missing equipment | Show its label, readiness, consumption status, and that odds include this state | Missing gear remains selectable with its already-penalized odds |
| No required gear | Choice has no gear requirement | Show `No equipment required` so every option has the same information hierarchy | N/A |
| Resolved mission | Selected path contains passes, failures, and critical passes | Outcome groups exact awarded XP by checked skill; failures add zero and critical bonus is included | Older resolutions without the field keep rendering existing rewards |

</frozen-after-approval>

## Code Map

- `shared/job.ts` -- mission view and resolution contracts exposed to the client.
- `server/src/engine/SkillExperienceService.ts` -- authoritative normal, critical, and awarded skill-XP calculations.
- `server/src/services/MissionViewService.ts` -- redacts hidden rolls while projecting current-choice information.
- `server/src/services/MissionService.ts` -- applies each chosen check and builds the final resolution.
- `server/src/engine/__tests__/skillExperience.test.ts` -- existing skill-XP rule coverage.
- `client/src/components/MissionRunner/MissionRunner.tsx` -- active beat and choice rendering.
- `client/src/components/MissionRunner/MissionOutcomePanel.tsx` -- resolved reward presentation.
- `client/src/components/MissionRunner/MissionRunnerMocks.ts` -- Storybook mission contract examples.

## Tasks & Acceptance

**Execution:**
- [x] `shared/job.ts` -- add public choice-odds/XP-preview fields and an optional per-skill resolution summary without exposing hidden roll fields.
- [x] `server/src/engine/SkillExperienceService.ts` -- share one calculation for normal/critical previews, actual awards, and selected-path aggregation.
- [x] `server/src/services/MissionViewService.ts` -- project pass chance and XP previews while preserving future-result redaction and legacy tolerance.
- [x] `server/src/services/MissionService.ts` -- persist exact selected-path skill XP in the final mission resolution.
- [x] `client/src/components/MissionRunner/MissionChoiceCard.tsx` and `MissionRunner.tsx` -- render consistent narrative, skill, odds, XP, and equipment readouts for each choice.
- [x] `client/src/components/MissionRunner/MissionSkillExperienceSummary.tsx` and `MissionOutcomePanel.tsx` -- display grouped earned skill XP, including a zero-gain state for new resolutions.
- [x] `client/src/components/MissionRunner/MissionRunnerMocks.ts` and `MissionRunner.stories.tsx` -- cover equipped, missing-equipment, and resolved XP-summary states.
- [x] `server/src/engine/__tests__/skillExperience.test.ts` and focused mission-view tests -- cover preview math, exact aggregation, failure exclusion, critical bonuses, and roll redaction.

**Acceptance Criteria:**
- Given any current job option, when it renders, then its skill check, difficulty, complementary success/failure percentages, possible skill XP, and equipment state are visible before selection.
- Given the player selects an option, when the request resolves, then the existing server-authoritative outcome and mutation behavior is unchanged.
- Given a mission resolves, when the outcome appears, then skill XP earned across the chosen path is grouped by skill beside cash, heat, and player experience.
- Given assistive technology or a narrow viewport, when choices render, then labels remain explicit, statistics remain readable, and selection buttons stay keyboard accessible.

## Spec Change Log

## Design Notes

Each option remains a narrative action first. Beneath its label, use a compact dossier-style stats grid: `Skill / Difficulty`, `Success / Failure`, `Skill XP`, then one equipment status line. Brass frames neutral information, profit marks success/readiness, and danger marks failure/missing gear. Percentages are descriptive—not progress bars—because they compare two exact outcomes.

## Verification

**Commands:**
- `yarn --cwd server test` -- expected: XP preview/aggregation and mission-view privacy tests pass.
- `yarn --cwd server typecheck` -- expected: shared and server contracts compile.
- `yarn --cwd client test` -- expected: existing client regressions remain green.
- `yarn --cwd client tsc --noEmit --incremental false` -- expected: app and stories compile against the new mission contract.
- `yarn --cwd client eslint src/components/MissionRunner` -- expected: touched mission UI files pass ESLint.

**Manual checks (if no CLI):**
- Inspect active and resolved MissionRunner stories at narrow and wide widths; verify percentages complement to 100, gear states are explicit, hidden roll outcomes are absent, and earned skill XP is readable.
