---
title: 'Mission Gear Paths and Power Clarity'
type: 'bugfix'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e3e854c7b2a7b92619c3ffd323271090d3f5edf4'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Job cards advertise mission gear that can be absent from the entire generated choice tree, so a carried Lockpick Set may never have a possible use. The choice breakdown also shows starter character and equipment power as separate `+0%` rows without explaining that they accumulate toward one combined threshold.

**Approach:** Give every declared gear requirement one deterministic, approach-valid edge somewhere in each newly generated mission tree, while retaining its authored chance for additional appearances. Preserve the approved `floor((character power + equipment power) / powerDivisor)` odds rule and make its combined threshold progress explicit in the server-authored breakdown UI.

## Boundaries & Constraints

**Always:** Guarantee at least one reachable edge per distinct template gear requirement before calculating difficulty, checks, momentum, damage, or outcomes; keep the guaranteed edge on an authored eligible approach; retain random extra occurrences; reject templates with more requirements than distinct beat nodes available for deterministic placement; apply the invariant whether or not the player owns the item; snapshot the strongest exact accepted item; preserve missing-gear penalties, satisfied-gear bonuses, reservations, and reusable/consumable behavior; keep existing active missions immutable; keep new breakdown fields optional for legacy mission documents; show that character and equipment power combine and how much remains before the next `+1%` step.

**Ask First:** Changing the power divisor or floor-based probability rule; guaranteeing gear on the opening choices or every player-selected route; changing gear bonuses, penalties, item availability, consumption, rewards, or mission difficulty; rebuilding stored active missions.

**Never:** Advertise an impossible zero-chance requirement; reveal unvisited branches or future rolls; recalculate authoritative odds in the browser; require recommended gear to accept a job; consume reusable tools such as the Lockpick Set; patch gear onto a completed tree after dependent checks and outcomes have been calculated; add dependencies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Lockpick path | Depth-3 mission, Lockpick Set at partial chance | At least one complete root-to-leaf path contains an eligible Lockpick edge; other eligible edges still use the authored chance | No future path is exposed to the client |
| Competing gear | Several requirements share approaches | Every requirement appears on at least one edge and none is starved by an earlier entry | Reject zero-chance or unschedulable requirement sets |
| Prepared or missing | Player has or lacks matching gear | The guaranteed edge snapshots the exact reusable item and bonus, or remains selectable with its missing penalty | Reusable gear is reserved but not consumed |
| Starter power | Character 2, equipment 3, divisor 25 | Odds remain `+0%`; UI explains combined power 5 and 20 remaining to the next `+1%` | Legacy breakdowns render without the progress line |
| Threshold power | Combined power reaches 25 | Authoritative total receives exactly `+1%`, attributed by the existing character/equipment breakdown | Rounding and clamp adjustment still reconcile to final chance |

</frozen-after-approval>

## Code Map

- `server/src/engine/SkeletonBuilder.ts` -- selects approaches, attaches gear, and calculates the dependent mission tree.
- `shared/missionTemplate.ts` -- validates authored gear chances.
- `server/src/engine/MomentumService.ts`, `shared/job.ts` -- produce and type the authoritative power breakdown.
- `client/src/components/MissionRunner/MissionCheckBreakdown.tsx` -- renders choice probability components and power progress.
- `server/src/engine/__tests__/{missionEquipment,missionCatalog}.test.ts` -- focused gear/power and full production-template coverage.
- `server/src/services/__tests__/MissionViewService.test.ts`, `client/src/components/MissionRunner/MissionRunnerMocks.ts` -- legacy-safe view projection and UI fixtures.

## Tasks & Acceptance

**Execution:**
- [x] `server/src/engine/SkeletonBuilder.ts` -- plan one deterministic eligible edge for each requirement before recursive calculation, then use normal chance rolls for all other edges.
- [x] `shared/missionTemplate.ts`, `server/missions/README.md` -- disallow zero-chance or over-capacity advertised gear and document the one-path guarantee.
- [x] `shared/job.ts`, `server/src/engine/MomentumService.ts` -- expose the configured power step in new breakdowns without altering probability math or stored legacy results.
- [x] `client/src/components/MissionRunner/MissionCheckBreakdown.tsx`, `client/src/components/MissionRunner/MissionRunnerMocks.ts` -- explain combined power progress and exercise an exact reusable Lockpick match.
- [x] `server/src/engine/__tests__/{missionEquipment,missionCatalog}.test.ts`, `server/src/services/__tests__/MissionViewService.test.ts` -- cover the known no-Lockpick seed, overlapping requirements, prepared/missing paths, non-consumption, starter/threshold power, projection, and legacy fields.

**Acceptance Criteria:**
- Given any shipped template advertises gear, when a new mission tree is generated, then each declared requirement occurs on at least one valid root-to-leaf path and its dependent math is internally consistent.
- Given a player carries a Lockpick Set and reaches its edge, when the choice renders and resolves, then the exact set is named, its readiness benefit is included, and it remains in inventory.
- Given power is below or at a configured threshold, when the breakdown renders, then the displayed progress and bonus match the unchanged server calculation and all components reconcile to final chance.

## Spec Change Log

## Design Notes

The guarantee must be planned before tree calculation: attaching gear later would change difficulty, pass chance, momentum, damage, and descendant outcome tiers. “One path” is intentionally weaker than “every run sees every item”; choices remain varied, but a job can no longer advertise gear that is mechanically absent from its complete tree.

## Verification

**Commands:**
- `yarn --cwd server test` -- all engine, catalog, service, and legacy regressions pass.
- `yarn --cwd server typecheck` -- shared and server contracts compile.
- `yarn --cwd client test` -- client regressions pass.
- `yarn --cwd client tsc --noEmit --incremental false` -- mission UI and fixtures compile.
- `yarn --cwd client eslint src/components/MissionRunner` -- touched UI passes lint.

## Suggested Review Order

**Guaranteed mission gear paths**

- Preplans compatible nodes before any check or outcome calculation.
  [`SkeletonBuilder.ts:241`](../../server/src/engine/SkeletonBuilder.ts#L241)

- Applies guaranteed and normal chance-driven requirements through one item-selection path.
  [`SkeletonBuilder.ts:329`](../../server/src/engine/SkeletonBuilder.ts#L329)

- Rejects chances below d100 precision and unschedulable requirement counts.
  [`missionTemplate.ts:31`](../../shared/missionTemplate.ts#L31)

- Documents tree-wide guarantees, route limits, and fallback approach replacement.
  [`README.md:231`](../../server/missions/README.md#L231)

**Power threshold clarity**

- Exposes the authoritative configured divisor without changing probability math.
  [`MomentumService.ts:96`](../../server/src/engine/MomentumService.ts#L96)

- Keeps the new divisor optional for stored legacy mission breakdowns.
  [`job.ts:125`](../../shared/job.ts#L125)

- Shows baseline combined power and distance to the next bonus.
  [`MissionCheckBreakdown.tsx:19`](../../client/src/components/MissionRunner/MissionCheckBreakdown.tsx#L19)

**Regression coverage**

- Reproduces the missing Lockpick path and proves reusable exact-item behavior.
  [`missionEquipment.test.ts:106`](../../server/src/engine/__tests__/missionEquipment.test.ts#L106)

- Proves guaranteed placement coexists with genuine partial-chance extras.
  [`missionEquipment.test.ts:193`](../../server/src/engine/__tests__/missionEquipment.test.ts#L193)

- Audits every shipped template for an eligible path per requirement.
  [`missionCatalog.test.ts:387`](../../server/src/engine/__tests__/missionCatalog.test.ts#L387)

- Verifies exact Lockpick projection and legacy power-field omission.
  [`MissionViewService.test.ts:122`](../../server/src/services/__tests__/MissionViewService.test.ts#L122)

**Deferred follow-ups**

- Records pre-existing chance-competition and duplicate-depth concerns separately.
  [`deferred-work.md:10`](deferred-work.md#L10)
