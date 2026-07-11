# Mission files

Everything the mission system can be tuned with lives in this folder — no
code changes needed. There are two kinds of files:

| File | What it controls |
|---|---|
| `_engine.yml` | Global rules: what a skill point, a critical, or a momentum point means. Applies to **all** missions. |
| `<mission>.yml` (e.g. `docks-robbery.yml`) | One mission template: its level band, difficulty, money, heat, XP, gear demands, outcome payouts, and story seeds. |

Files are validated at server startup (zod, strict). A typo'd key, a missing
field, or an out-of-range value stops the server with the exact problem —
nothing fails silently. Files starting with `_` are never loaded as missions.

**Scale:** skills, player levels, and check difficulties all run on a
**1–100 scale**. A template's numbers are anchored to its `levels` band — a
level-50 job is difficulty ~50, not "5 out of 10".

**To add a mission:** copy an existing mission file, change the `id` (it must
match the filename), tune the knobs, write new story seeds. Restart the
server. Done — its seeds join the job-board pool automatically.

**Note:** missions snapshot their template when a player accepts them, so
editing a file only affects *newly accepted* jobs, never runs in progress.

---

## How a mission plays (the pipeline)

1. **Board** — `board.size` offers are drawn from templates whose `levels`
   band matches the player. Each offer's numbers come from that template's
   formulas below.
2. **Accept** — the engine builds the full decision tree (`depth` choices
   deep) and pre-rolls every check from a stored seed. Everything mechanical
   is decided at this moment; the LLM only writes the prose afterwards.
3. **Play** — each choice tests a skill. Pass/fail moves *momentum*; failed
   risky choices also apply their precomputed damage after accepted armor soak.
4. **End** — final momentum picks an outcome tier; the tier's knobs decide
   cash, heat, and XP.

---

## `_engine.yml` — global parameters

### `board`

| Key | Meaning |
|---|---|
| `size` | Offers shown on the job board. |
| `levelGrace` | A template keeps appearing until `playerLevel > levels.max + levelGrace`, so outleveled jobs fade off the board instead of vanishing overnight. |

### `checks`

Every choice tests one skill: force→muscle, quiet→stealth,
social→leadership, deception→corruption, opportunistic→strategy,
technical→tech.

**Difficulty of a single check:**

```
checkDifficulty = clamp( jobDifficulty
                       + floor(playerHeat / heatPressureDivisor)
                       + beatDepth × perBeatDepth
                       ± saferBolderGap
                       ± gear modifiers,      1, 100 )
```

| Key | Meaning |
|---|---|
| `perBeatDepth` | How much harder checks get per beat into the mission (beat 0, 1, 2…). |
| `saferBolderGap` | Each beat offers two choices: one easier (−gap), one harder (+gap). |
| `heatPressureDivisor` | +1 check difficulty per this much player heat. |

**Chance to pass it:**

```
passChance = clamp( baseChance
                  + perSkillPoint × skillValue           (skill 1-100)
                  + perDifficulty × checkDifficulty      (negative!)
                  + floor((character power + accepted equipment power)
                          / powerDivisor)
                  + consumed-item power step
                  − floor(playerHeat / heatChanceDivisor),
                  minChance, maxChance )
```

| Key | Meaning |
|---|---|
| `baseChance` | Starting chance before modifiers. |
| `perSkillPoint` | % added per point in the tested skill. |
| `perDifficulty` | % per point of check difficulty — keep negative. |
| `powerDivisor` | +1% per this much effective power. |
| `heatChanceDivisor` | −1% per this much player heat. |
| `minChance` / `maxChance` | Floor/ceiling — nothing is ever certain. |
| `criticalMargin` | Beating/missing the chance by this much makes the check *critical* (extra momentum, doubled skill XP). |

Only equipped power is part of the locked mission baseline. If a choice
spends an exact consumable, that edge adds the difference between the power
step with and without the item's power. Unused stash power contributes zero.
Weapons remain generic power: weapon category never changes the skill an
approach tests.

Tuned so an at-level player with at-level gear sits around 55-60%, climbing
toward ~75% at level 100 with top-shelf equipment. The engine pre-rolls a
d100 per choice at accept time (seeded — a mission always replays
identically). Roll ≤ passChance = pass.

### `gear`

Global half of the gear system (per-mission half: the `gear` array below).

| Key | Meaning |
|---|---|
| `satisfiedBonus` | Check gets this much *easier* when the player carries demanded gear. |
| `missingPenalty` | Check gets this much *harder* when they improvise without it. |

### Health and armor

Health runs from 1–100. A failed choice covered by its template's
`healthRisk.approaches` deals `ceil(checkDifficulty / 5)` incoming damage.
The equipment accepted with the mission absorbs `ceil(totalArmor / 30)`,
capped at the incoming amount. Damage never drops Health below 1. Health
recovers by 10 per idle hour, and kits can be used between mission choices.
Healing never changes the mission's stored rolls, tree, or narration.

### `momentum`

| Key | Meaning |
|---|---|
| `pass` | Momentum gained on a passed check. |
| `fail` | Momentum on a failed check — keep negative. |
| `criticalBonus` | Extra ± momentum when the check was critical. |

Outcome tier bands are **derived** from `pass × depth` (a "perfect run"):
jackpot = perfect run + a critical, successful = perfect run,
partially_successful = net positive, partial_failure = net ≤ 0,
failure = every check failed, disaster = failed with multiple criticals.
Changing `pass`/`fail` reshapes what every tier means — tune carefully.

---

## `<mission>.yml` — per-mission parameters

### Identity

| Key | Meaning |
|---|---|
| `id` | Unique slug, must equal the filename minus `.yml`. Duplicates fail startup. |
| `name` | Display name. |
| `type` | Free-form job type (`robbery`, `heist`, `racket`, `ambush`, …). |
| `district` | Free-form district shown on the offer card. |
| `depth` | Choices per run, 3–5. **The tree doubles per level**: depth 3 = 15 narrated nodes, depth 4 = 31, depth 5 = 63 — that's the LLM cost per accepted job. |

### `levels`

```
levels:
  min: 30
  max: 42
```

The player-level band the job is written for. The board offers a template
while `playerLevel ≥ min` and `playerLevel ≤ max + board.levelGrace`. Bands
overlap on purpose so the board always has 2-3 templates to draw from at any
level.

### `difficulty`

```
jobDifficulty = clamp(round(base + perLevel × (playerLevel − levels.min)), 1, 100)
```

| Key | Meaning |
|---|---|
| `base` | Difficulty at the bottom of the band — roughly `levels.min + 1`. |
| `perLevel` | Growth per player level above `levels.min`. Choose it so difficulty at `levels.max` lands ≈ `levels.max + 3`: jobs start comfortable and end slightly above your weight, nudging you to the next band. |

Job difficulty feeds check difficulty, heat, and XP — it's the master "how
hard is this" dial.

### `rewards`

```
rewardMin = roundToFive(cashBase + cashPerLevel × playerLevel)
rewardMax = roundToFive(rewardMin + spreadBase + spreadPerLevel × playerLevel)
```

| Key | Meaning |
|---|---|
| `cashBase` / `cashPerLevel` | Floor of the take and how it scales with player level. |
| `spreadBase` / `spreadPerLevel` | Gap between min and max take. |
| `xpBase` | Flat mission XP before difficulty scaling. |
| `xpPerDifficulty` | Mission XP per point of job difficulty. Convention: 6 for depth-3 templates, 7.5 for depth 4, 9 for depth 5 — deeper runs earn more. |

Base mission XP = `xpBase + jobDifficulty × xpPerDifficulty`; outcome tiers
multiply it. Balance convention: `cashPerLevel` ≈ 45-50 on safe shallow
jobs, ≈ 55-60 mid, up to 70 on deep high-risk scores.

### `heat`

```
heatIncrease = clamp(base + floor(jobDifficulty × perDifficulty), 1, max)
```

This is the *base* heat cost shown on the offer; outcome tiers scale it.
Convention: `base` 2 → 5 and `max` 8 → 18 from street work to endgame,
`perDifficulty` 0.06–0.12.

### `skillExperience`

XP awarded to the tested skill each time the player **passes** a check:

```
skillXp = round((basePerSuccess + perCheckDifficulty × checkDifficulty)
                × (critical ? criticalMultiplier : 1))
```

Current convention across regular templates: `basePerSuccess: 30`,
`perCheckDifficulty: 0.05`, `criticalMultiplier: 2` (lay-low uses a smaller
base award).

### `healthRisk`

Every mission declares the approaches whose failed choices can hurt the
player. `force` is always risky; mission-specific approaches add hazards that
fit that job. The full damage and soak result is stored on the edge, hidden
until the choice is taken, and then narrated from engine facts.

### `gear` (optional)

A list of equipment demands the mission can spring on the player. Every
entry is guaranteed on one deterministic, approach-valid edge somewhere in
each newly accepted mission tree; additional eligible edges still use the
authored `chance`. The guarantee is for the complete tree, not the opening
choices or every route a player might select. Placement prefers a beat whose
random approaches already match; only when no unused compatible beat exists
does generation replace one approach with an authored eligible approach.

```
gear:
  - approaches: [technical, force]   # edges with one of these approaches can roll it
    chance: 0.55                     # probability an additional eligible edge demands it
    consumes: true                   # spent on use (grenades yes, crowbars no)
    label: Breaching Charge          # shown to the player
    tags: [breaching, explosive]     # any owned item with one of these tags satisfies it
```

When an edge demands gear: carrying a tagged item in loadout or stash makes
that check *easier* by `gear.satisfiedBonus` (and consumables get spent on
use); going in without one means improvising, `gear.missingPenalty` harder.
When several items match, the engine deterministically selects the strongest
one, snapshots its identity and power, and reserves enough exact quantity for
every still-possible path. Reusable tools are never spent. Consumables add
their power step only to the edge that uses them.

| Field | Meaning |
|---|---|
| `approaches` | Which of `deception` / `force` / `opportunistic` / `quiet` / `social` / `technical` edges may roll this. |
| `chance` | From 0.01 to 1, matching d100 precision; probability on non-guaranteed eligible edges. |
| `consumes` | `true` for explosives, smoke, flashbangs, and one-use getaway keys; `false` for tools (crowbar, lockpick, disguise, scanner, getaway equipment…). Healing kits are never mission gear. |
| `label` | Display name on the demand. |
| `tags` | Item tags that satisfy it. Current roles: `flashbang`, `smoke`, `explosive`, `breaching`, `lockpick`, `hacking`, `disguise`, `climbing`, `getaway`, `scanner`, `jammer`, `crowbar`. |

Authoring convention: levels 1–14 templates carry 0–1 entries at
`chance ≤ 0.35` (beginners shouldn't be gear-checked constantly); mid
templates 1–2 entries at 0.3–0.5; level 45+ templates 2–3 entries at
0.4–0.65 — endgame jobs assume a prepared professional. Match tags to
theme: vaults → breaching/explosive/hacking, stealth → smoke/
climbing/lockpick, social → disguise, vehicles → getaway/crowbar,
firefights → explosive/flashbang/scanner. Healing kits are live inventory,
not mission gear.

Each entry needs its own beat node for deterministic placement, so the
number of `gear` entries cannot exceed `2^depth - 1`. Invalid zero-chance or
over-capacity templates fail validation at server startup.

### `outcomes`

One block per tier — `jackpot`, `successful`, `partially_successful`,
`partial_failure`, `failure`, `disaster` (all six required):

| Key | Meaning |
|---|---|
| `cashFactor` | Payout = `roundToFive(cashFactor × rewardMax)`. 0 = walks away empty. |
| `heatFactor` | Multiplies the base heat (`ceil`ed). 0.5 = clean job draws half attention. |
| `heatBonus` | Flat heat added on top — punish bad endings here. |
| `xpFactor` | Multiplies base mission XP (`xpBase + jobDifficulty × xpPerDifficulty`). |

House pattern (small per-template variation for personality is fine):
jackpot ≈ 1.6–1.85 / 2xp, successful 1 / 1.5xp at half heat,
partially_successful ≈ 0.7 / 1xp, partial_failure ≈ 0.2 / 0.5xp,
failure 0 / 0.25xp, disaster 0 / 0.1xp with `heatBonus` climbing as tiers
worsen (disaster 6–12 by band).

Convention: `failure` narrates a hospital ending; `disaster` sends the player
to jail. Per-choice Health damage is independent of those outcome tiers.

### `storySeeds`

At least one (in practice 4–6); each is a board-offer premise the LLM builds
the story from:

| Key | Meaning |
|---|---|
| `location` | Where the job happens (also the offer card title). |
| `premise` | The setup — what the score is and why it's possible. |
| `pressure` | The complication — what makes it dangerous or urgent. |

More seeds = more variety; each seed is one candidate slot on the board.
YAML note: a seed line containing `: ` (colon-space) must be a block scalar
(`>-`) or quoted, or the parser rejects the file.

---

## Current template lineup

| id | levels | depth | district | gear tags |
|---|---|---|---|---|
| `corner-hustle` | 1–6 | 3 | Old Quarter | — |
| `back-alley-collection` | 1–7 | 3 | Old Quarter | — |
| `lay-low` | 1–100 | 3 | Old Quarter | — |
| `downtown-convenience-store` | 2–10 | 3 | Downtown | lockpick |
| `bootlegger-truck-robbery` | 4–12 | 3 | Riverside | lockpick |
| `chop-shop-run` | 5–14 | 3 | Ironworks | crowbar |
| `docks-robbery` | 8–18 | 3 | The Docks | lockpick |
| `riverside-card-game-shakedown` | 8–18 | 3 | Riverside | explosive |
| `warehouse-hijack` | 12–22 | 4 | The Docks | crowbar, breaching |
| `union-payroll-theft` | 14–25 | 4 | Ironworks | crowbar, breaching |
| `jewelry-store-heist` | 18–28 | 4 | Hillcrest | lockpick, climbing, disguise |
| `speakeasy-takeover` | 20–32 | 4 | Old Quarter | flashbang, disguise |
| `protection-racket-war` | 24–35 | 4 | Old Quarter | flashbang, disguise |
| `corrupt-cop-ledger` | 28–40 | 4 | Downtown | climbing, disguise |
| `armored-car-ambush` | 30–42 | 4 | Riverside | explosive, flashbang |
| `train-yard-hijack` | 35–48 | 4 | Ironworks | hacking, getaway, explosive |
| `casino-skim` | 36–48 | 4 | Neon Strip | disguise, hacking |
| `nightclub-casino-robbery` | 42–56 | 4 | Neon Strip | disguise, hacking, scanner |
| `downtown-bank-heist` | 45–60 | 5 | Downtown | breaching/explosive, smoke, getaway |
| `rival-crew-takedown` | 50–62 | 4 | Ironworks | flashbang, scanner |
| `federal-evidence-transfer` | 50–65 | 5 | Downtown | scanner, smoke, breaching |
| `evidence-vault-break-in` | 58–70 | 5 | Downtown | hacking, lockpick, scanner |
| `syndicate-arms-convoy` | 60–74 | 5 | The Docks | getaway, smoke, explosive |
| `arms-deal-hijack` | 65–78 | 5 | The Docks | jammer, getaway, smoke |
| `casino-vault-job` | 72–85 | 5 | Neon Strip | breaching/explosive, hacking, disguise |
| `hotel-summit-hit` | 72–86 | 5 | Hillcrest | jammer, disguise, scanner |
| `cartel-exchange-ambush` | 80–92 | 5 | Riverside | explosive, flashbang |
| `treasury-gold-transfer` | 84–100 | 5 | Downtown | breaching/explosive, hacking, climbing, jammer |
| `central-bank-vault` | 88–100 | 5 | Downtown | breaching/explosive, hacking, climbing, jammer |

All 29 templates have been path-tested at both ends of their level band.
Every level 1–100 falls inside at least one band, and bands overlap so the
board never runs dry at a band edge.
