---
title: 'Equipment-Driven Mission Balance'
type: 'feature'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e96317d1cdbb488a510cb2cfadd8cb22385a8a19'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mission equipment is opaque and inconsistent: recommendations conflict with unlock levels, ammunition creates false matches, power/effect contributions are hidden, and armor cannot protect health. The mission screen also lacks live condition, accepted equipment, and healing actions.

**Approach:** Remove ammunition; keep weapons power-only; give every head, torso, waist, and feet item power plus armor; make existing passive modifiers prominent; add deterministic damage/soak; show authoritative check math, accepted equipment, live health, and between-choice healing; and expand the mission roster across levels 1–100.

## Boundaries & Constraints

**Always:** Snapshot equipped power, armor, and effects at acceptance; exclude ordinary stash power from checks; when a choice uses and spends an exact consumable, add that item’s power to that choice only and show it separately; select the strongest valid match and reserve its quantity until used or the mission ends; preserve current power math while exposing exact character/equipment/consumable percentages; add every equipped hand weapon’s power to the generic bonus used by all skills; keep hand weapons power-only; require power+armor on head/torso/waist/feet; display relevant skill/approach effects; use accepted armor for damage soak; keep Health/healing inventory live; never let healing alter stored mission state; normalize legacy data; make recommendations obtainable at entry; give every remaining catalog item a tested role; traverse every complete path of every shipped mission at its band minimum and maximum. Add another skill only for a concrete non-weapon action existing skills cannot represent, with migration, XP, UI, and tests; none is currently required.

**Ask First:** Changing the generic weapon-power rule, a combat loop, death/hospital, durability, dependencies, or price/reward changes.

**Never:** Expose future rolls; calculate odds in the browser; let an unused stash item or post-accept gear swap affect checks; apply active-use healing/drug/liquor power to a mission edge; map weapon categories to skills; give hand weapons armor/tags/effects; retain ammunition; consume reusable tools; waste healing at full health.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Power/effects | Character/equipped power, unused stash item, consumed explosive | Show base/equipment percentages and effects; unused stash adds 0%; exact spent explosive adds a named one-edge percentage | Components sum to final chance |
| Health risk | Failed risky edge with accepted armor | Reveal raw damage, absorbed amount, loss, and live Health | Apply once; clamp Health 1–100 |
| Healing | Injured between beats with a kit | Consume one, update Health/stash, preserve mission tree | Disable when full, busy, or resolved |
| Retired ammo | Stale catalog/stash/board data | New play omits it; active legacy mission remains finishable | No broken item or tag match |

</frozen-after-approval>

## Code Map

- `shared/{equipment,player,playerPower,job,missionTemplate,health}.ts` -- equipment/health contracts, snapshots, check breakdowns, and recovery.
- `server/src/engine/*`, `server/src/services/{Mission,Player,Loadout,MissionView}Service.ts`, `server/src/services/ai/MissionPrompts.ts` -- authoritative modifiers, damage, healing, redaction, and narration.
- `server/src/seedData/*`, `server/missions/*` -- ammunition retirement, wearable armor, healing, risks, and recommendation balance.
- `client/src/components/MissionRunner/*`, `client/src/app/jobs/*`, `client/src/components/CharacterStats/*` -- accepted stats/loadout/effects, live Health, and healing UI.

## Tasks & Acceptance

**Execution:**
- [x] `shared/{equipment,player,playerPower,job,missionTemplate,health}.ts` -- add Health/healing, accepted loadout and exact consumed-item snapshots, server modifier breakdowns, risks, and legacy fallbacks.
- [x] `server/src/seedData/*`, `client/public/images/items/*` -- delete ammo records/assets/stale docs; remove weapon tags/effects; add waist armor `2/4/8/12/17/21/27`; preserve non-hand effects; add kit healing `25/50/100`; filter retired stash items.
- [x] `server/src/engine/*`, `server/src/services/*` -- attribute power, select/reserve/path-count consumables by item ID, prevent reserved-item sale/use, derive spending from the match, snapshot effects, replace armor’s old bonuses with soak, and apply damage/healing once.
- [x] `server/missions/*`, `server/src/services/JobBoardService.ts` -- add risk policies to the existing 17 missions, apply the gear map below, add 12 balanced missions spanning levels 1–100, update docs, and invalidate old boards.
- [x] `client/src/components/MissionRunner/*`, `client/src/app/jobs/*` -- show live Health, accepted Power/Armor/five slots/effects, server check math, protection, and serialized kit actions.
- [x] `server/src/**/__tests__/*`, client tests/stories -- cover every remaining item by role and every root-to-leaf path of all 29 missions at band min/max, plus power/effects, armor, healing/idempotency, redaction, ammo retirement, and legacy states.

**Acceptance Criteria:**
- Given any remaining item, when audited, then it contributes through equipped stats/effects, mission gear, healing, or preparation; every tactical tag has valid coverage.
- Given all shipped mission templates, when the generated suite runs at each band edge, then every complete path has internally consistent checks, equipment use, damage, momentum, and outcome tiers.
- Given character power 2, equipment power 30, and arbitrary stash power, when a choice renders, then it reports `floor(32/25)=1%`, attributes it exactly, and ignores stash.
- Given that same loadout and a Power 38 explosive consumed by one choice, when odds are built, then that edge reports `floor(70/25)-floor(32/25)=1%` from the named explosive, spends one, and other edges receive 0% from it.
- Given equal-power knife and firearm loadouts, when choices for any skills are built, then both provide the same generic power percentage and neither changes the skill selected by the choice approach.
- Given Don’s Armored Topcoat, when Leadership and unrelated checks are built, then Leadership displays/applies its `+12` at the configured rate and the other skill does not.
- Given a failed risky choice with Padded Work Vest, when it resolves and one kit is used, then armor/UI/narration match the stored damage and Health/stash update without changing mission state.

## Spec Change Log

## Design Notes

Normal power stays `floor((characterPower + equippedPower)/25)` and affects every skill generically. A choice consuming an item uses `floor((characterPower + equippedPower + itemPower)/25)` and reports `consumableBonus=withItemBonus-normalBonus`; all other stash power is zero. Choose the highest-power valid match, snapshot its ID/name/power, reserve and path-count quantity by item ID, then derive spending from its `consumable` flag; reserved stock cannot be sold or otherwise used mid-mission. Reusable tools may satisfy the existing gear-difficulty rule but add no power and are not spent. Weapon type never changes skill mapping. Server output includes base chance, skill/equipment/approach bonuses, difficulty, heat/intoxication, and final chance; the client only renders.

Each mission declares `healthRisk.approaches`; all include `force`. Add: opportunistic to Chop/Warehouse/Jewelry/Armored/Bank/Rival/Arms/Cartel/Central; quiet to Docks/Jewelry/Bank/Rival/Evidence/Arms/Casino Vault/Cartel/Central; technical to Warehouse/Armored/Bank/Evidence/Casino Vault/Central; social to Protection; deception to Casino Skim. Failed risky edges deal `ceil(difficulty/5)` damage; accepted armor absorbs `ceil(armor/30)`. Health starts 100, floors 1, recovers 10/hour. Kits heal 25/50/100 after a choice and are not mission gear.

Gear map: Corner/Lay Low none; Convenience (now L2+) Lockpick; Chop Crowbar; Docks Lockpick; Warehouse Crowbar+Breaching; Jewelry Lockpick+Climbing+Disguise; Protection Flashbang+Disguise; Armored Explosive+Flashbang; Casino Skim Disguise+Hacking; Bank Breaching+Smoke+Getaway; Rival Flashbang+Scanner; Evidence Hacking+Lockpick+Scanner; Arms Jammer+Getaway+Smoke; Casino Vault Breaching+Hacking+Disguise; Cartel Explosive+Flashbang; Central Breaching+Hacking+Climbing+Jammer. Remove AP, sniper, and medkit demands; tests require every remaining role to be available at mission entry.

Keep existing non-hand Leadership, Stealth, approach, and heat-reduction effects visible/tested; do not invent arbitrary values. Hand weapons retain only power. Kits heal; drugs/liquor remain preparation items and never contribute consumed-item power to locked edges.

## Verification

**Commands:**
- `yarn --cwd server test` -- all engine, production-data, mission, service, prompt, and legacy scenarios pass.
- `yarn --cwd server typecheck` -- shared/server contracts compile.
- `yarn --cwd client test && yarn --cwd client tsc --noEmit --incremental false` -- client logic and contracts pass.
- `yarn --cwd client eslint src/components/MissionRunner src/components/JobCard src/components/CharacterStats src/app/jobs` -- touched UI passes lint.

## Suggested Review Order

**Mission lifecycle and resolution**

- Acceptance freezes stats, builds the tree, and reserves exact equipment atomically.
  [`MissionService.ts:53`](../../server/src/services/MissionService.ts#L53)

- Subtree reservation preserves every possible path without over-spending exact items.
  [`SkeletonBuilder.ts:75`](../../server/src/engine/SkeletonBuilder.ts#L75)

- Each edge combines approach, equipment, power, deterministic rolls, and Health risk.
  [`SkeletonBuilder.ts:178`](../../server/src/engine/SkeletonBuilder.ts#L178)

- Choice transactions spend exact gear, clamp damage, and reject stale inventory.
  [`MissionService.ts:185`](../../server/src/services/MissionService.ts#L185)

- Awaited recovery prevents late writes from erasing mission damage.
  [`PlayerService.ts:48`](../../server/src/services/PlayerService.ts#L48)

**Equipment, power, and Health contracts**

- Server-authored breakdowns expose exact marginal character, equipment, and consumable power.
  [`MomentumService.ts:36`](../../server/src/engine/MomentumService.ts#L36)

- Catalog validation enforces armored wearables, power-only weapons, and separated active-use items.
  [`equipment.ts:116`](../../shared/equipment.ts#L116)

- Legacy normalization migrates Health, waist armor, kits, weapons, and retired ammunition.
  [`player.ts:203`](../../shared/player.ts#L203)

- Damage, armor soak, Health-floor attribution, and healing stay deterministic.
  [`HealthService.ts:10`](../../server/src/engine/HealthService.ts#L10)

- Accepted-state projection separates equipped stats from relevant stash gear.
  [`PlayerContextService.ts:74`](../../server/src/engine/PlayerContextService.ts#L74)

**Mission content and balance**

- The documented 29-mission roster spans levels 1–100 and every tactical role.
  [`README.md:310`](../../server/missions/README.md#L310)

- Board versioning invalidates recommendations built before the new equipment contract.
  [`JobBoardService.ts:17`](../../server/src/services/JobBoardService.ts#L17)

**Mission flow UI and narration**

- The runner binds live Health, accepted gear, choices, and final-edge feedback.
  [`MissionRunner.tsx:28`](../../client/src/components/MissionRunner/MissionRunner.tsx#L28)

- Choice cards render authoritative odds and exact future equipment use.
  [`MissionChoiceCard.tsx:14`](../../client/src/components/MissionRunner/MissionChoiceCard.tsx#L14)

- Health recovery, serialized kit actions, and visible failures share one panel.
  [`MissionHealthPanel.tsx:18`](../../client/src/components/MissionRunner/MissionHealthPanel.tsx#L18)

- Accepted slots expose per-item Power, Armor, effects, and relevant stash gear.
  [`MissionAcceptedEquipment.tsx:18`](../../client/src/components/MissionRunner/MissionAcceptedEquipment.tsx#L18)

- Job recommendations recompute strongest-item consumption mode from live inventory.
  [`JobCard.tsx:24`](../../client/src/components/JobCard/JobCard.tsx#L24)

- Outcome prompts narrate the final exact item, result, damage, and armor facts.
  [`MissionPrompts.ts:86`](../../server/src/services/ai/MissionPrompts.ts#L86)

**Executable coverage**

- Generated scenarios execute every complete mission path at both band edges.
  [`missionCatalog.test.ts:345`](../../server/src/engine/__tests__/missionCatalog.test.ts#L345)

- Every one of 111 catalog items executes its real mechanical role.
  [`equipmentCatalogRoles.test.ts:92`](../../server/src/engine/__tests__/equipmentCatalogRoles.test.ts#L92)

- Transaction tests prove missing gear, duplicate choices, and damage apply safely.
  [`MissionService.test.ts:65`](../../server/src/services/__tests__/MissionService.test.ts#L65)
