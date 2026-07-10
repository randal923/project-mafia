# Mission files

Everything the mission system can be tuned with lives in this folder — no
code changes needed. There are two kinds of files:

| File | What it controls |
|---|---|
| `_engine.yml` | Global rules: what a skill point, a critical, or a momentum point means. Applies to **all** missions. |
| `<mission>.yml` (e.g. `docks-robbery.yml`) | One mission template: its difficulty, money, heat, XP, outcome payouts, and story seeds. |

Files are validated at server startup (zod, strict). A typo'd key, a missing
field, or an out-of-range value stops the server with the exact problem —
nothing fails silently. Files starting with `_` are never loaded as missions.

**To add a mission:** copy an existing mission file, change the `id`, tune
the knobs, write new story seeds. Restart the server. Done — its seeds join
the job-board pool automatically.

**Note:** missions snapshot their template when a player accepts them, so
editing a file only affects *newly accepted* jobs, never runs in progress.

---

## How a mission plays (the pipeline)

1. **Board** — `board.size` offers are drawn from all templates' story
   seeds. Each offer's numbers come from that template's formulas below.
2. **Accept** — the engine builds the full decision tree (`depth` choices
   deep) and pre-rolls every check from a stored seed. Everything mechanical
   is decided at this moment; the LLM only writes the prose afterwards.
3. **Play** — each choice tests a skill. Pass/fail moves *momentum*.
4. **End** — final momentum picks an outcome tier; the tier's knobs decide
   cash, heat, and XP.

---

## `_engine.yml` — global parameters

### `board`

| Key | Meaning |
|---|---|
| `size` | Offers shown on the job board (1–6). |

### `power`

Effective power = the player's base power + all equipped item power.

| Key | Meaning |
|---|---|
| `tierBase` | Power up to this amount grants no tier. |
| `tierStep` | One power tier per this much power above `tierBase`. |

`powerTier = max(0, floor((effectivePower − tierBase) / tierStep))`
Power tiers raise mission difficulty *and* rewards (see mission formulas).

### `checks`

Every choice tests one skill: force→muscle, quiet→stealth,
social→leadership, deception→corruption, opportunistic→strategy
(business is reserved for future job types).

**Difficulty of a single check:**

```
checkDifficulty = clamp( jobDifficulty
                       + floor(playerHeat / heatPressureDivisor)
                       + beatDepth × perBeatDepth
                       ± saferBolderGap,     1, 10 )
```

| Key | Meaning |
|---|---|
| `perBeatDepth` | How much harder checks get per beat into the mission (beat 0, 1, 2…). |
| `saferBolderGap` | Each beat offers two choices: one easier (−gap), one harder (+gap). |
| `heatPressureDivisor` | +1 check difficulty per this much player heat. |

**Chance to pass it:**

```
passChance = clamp( baseChance
                  + perSkillPoint × skillValue
                  + perDifficulty × checkDifficulty      (negative!)
                  + floor(effectivePower / powerDivisor)
                  − floor(playerHeat / heatChanceDivisor),
                  minChance, maxChance )
```

| Key | Meaning |
|---|---|
| `baseChance` | Starting chance before modifiers (50 = coin flip). |
| `perSkillPoint` | % added per point in the tested skill. |
| `perDifficulty` | % per point of check difficulty — keep negative. |
| `powerDivisor` | +1% per this much effective power. |
| `heatChanceDivisor` | −1% per this much player heat. |
| `minChance` / `maxChance` | Floor/ceiling — nothing is ever certain. |
| `criticalMargin` | Beating/missing the chance by this much makes the check *critical* (extra momentum, doubled skill XP). |

The engine pre-rolls a d100 per choice at accept time (seeded — a mission
always replays identically). Roll ≤ passChance = pass.

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
| `id` | Unique slug. Duplicate ids across files fail startup. |
| `name` | Display name. |
| `type` | Free-form job type (`robbery`, …). |
| `district` | Free-form district shown on the offer card. |
| `depth` | Choices per run, 3–5. **The tree doubles per level**: depth 3 = 15 narrated nodes, depth 4 = 31, depth 5 = 63 — that's the LLM cost per accepted job. |

### `difficulty`

```
jobDifficulty = clamp(base + perRankTier × rankTier + perPowerTier × powerTier, 1, 10)
```

`rankTier` = 0 (nobody) … 6 (city_kingpin). Job difficulty feeds check
difficulty, heat, and XP — it's the master "how hard is this" dial.

### `rewards`

```
rewardMin = roundToFive(cashBase + cashPerRankTier × rankTier + cashPerPowerTier × powerTier)
rewardMax = roundToFive(rewardMin + spreadBase + spreadPerRankTier × rankTier + spreadPerPowerTier × powerTier)
```

| Key | Meaning |
|---|---|
| `cashBase` / `cashPerRankTier` / `cashPerPowerTier` | Floor of the take and how it scales. |
| `spreadBase` / `spreadPerRankTier` / `spreadPerPowerTier` | Gap between min and max take. |
| `xpPerDifficulty` | Base mission XP per point of job difficulty. |

### `heat`

```
heatIncrease = clamp(base + floor(jobDifficulty × perDifficulty), 1, max)
```

This is the *base* heat cost shown on the offer; outcome tiers scale it.

### `skillExperience`

XP awarded to the tested skill each time the player **passes** a check:

```
skillXp = round((basePerSuccess + perCheckDifficulty × checkDifficulty)
                × (critical ? criticalMultiplier : 1))
```

### `outcomes`

One block per tier — `jackpot`, `successful`, `partially_successful`,
`partial_failure`, `failure`, `disaster` (all six required):

| Key | Meaning |
|---|---|
| `cashFactor` | Payout = `roundToFive(cashFactor × rewardMax)`. 0 = walks away empty. |
| `heatFactor` | Multiplies the base heat (`ceil`ed). 0.5 = clean job draws half attention. |
| `heatBonus` | Flat heat added on top — punish bad endings here. |
| `xpFactor` | Multiplies base mission XP (`jobDifficulty × xpPerDifficulty`). |

Convention: `failure` narrates a hospital ending, `disaster` a jail ending —
both are story-only for now, but the tier is recorded on the player's
narrative event for future hospital/jail systems.

### `storySeeds`

At least one; each is a board-offer premise the LLM builds the story from:

| Key | Meaning |
|---|---|
| `location` | Where the job happens (also the offer card title). |
| `premise` | The setup — what the score is and why it's possible. |
| `pressure` | The complication — what makes it dangerous or urgent. |

More seeds = more variety; each seed is one candidate slot on the board.
