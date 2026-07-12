# Empire Expansion — Game Design Plan

From solo jobs grinder → persistent multiplayer city-conquest game with seasons.
All systems below ship together as one release (the season launch); the build order
at the end sequences the work internally, not the shipping.

**Core fantasy:** start as a nobody running corner hustles, hire and arm a crew, buy
rackets, fight for the buildings and turf of the city, and be the boss standing when
the season ends.

**Design pillars**

1. **Everything builds on what exists.** Crew members work like equipment (skill/approach
   bonuses feeding the same check formula) and wear real equipment from the existing
   catalog. Territory takeovers are missions. The newspaper is the `narrativeEvents` log,
   aggregated and narrated by the same LLM narrator. The 7 mission districts become the
   7 map districts. Ranks gate feature unlocks.
2. **Active play stays king.** Passive income (buildings) supplements missions, never
   replaces them — capped storage forces check-ins, staffing/upgrades create decisions.
3. **Aggression has a price, losing has a floor.** Heat, upkeep, and revenge mechanics
   prevent snowballing; safe off-map holdings guarantee a wiped-out player rebuilds
   instead of quitting.
4. **Capture, don't destroy.** Conquest moves value around the city instead of shrinking
   it — flipped buildings change hands damaged, they don't burn down.

---

## Player journey (beginning → end of season)

| Stage | Rank gate | Loop |
|---|---|---|
| **Tutorial** (lvl 1–5) | nobody | Solo jobs, first equipment. Unchanged from today. |
| **First crew** (lvl ~6) | street_hustler | Hire 1–2 crew, arm them, bring them on jobs for check bonuses. |
| **First racket** (lvl ~15) | crew_leader | Buy a personal holding (front), staff it, collect income, pay wages. |
| **Turf** (lvl ~25) | local_boss | Map unlocks. Claim neutral turf via takeover missions. Build rackets on turf. |
| **War** (lvl ~40) | district_boss | PvP attacks on other players' turf and the buildings on it. Defense assignments. Newspaper reports the wars. |
| **Conquest** (lvl 60+) | crime_lord+ | Landmark sieges, district control bonuses, strongholds, season victory race. |

Daily loop at maturity: collect income → pay wages → read the newspaper (who attacked
whom, hot districts, bounties) → run jobs with crew → repair/reinforce or launch an attack.

---

## System 1 — Crew (NPC hiring, equipment & management page)

**Crew member model** (`players/{uid}/crew` subcollection):
- **Archetype** maps 1:1 to the 7 skills: Enforcer (muscle), Ghost (stealth), Face (charisma),
  Fixer (corruption), Underboss (leadership), Mastermind (strategy), Wirehead (tech).
- Fields: `name`, `archetype`, `tier` (1–5: associate → soldier → veteran → capo → legend),
  `skillLevel`, `power`, `wage` (per in-game day), `loyalty` (0–100), `status`
  (idle / on_job / assigned_building / assigned_turf / injured / imprisoned / dead),
  `loadout` (see below), `traits[]` (e.g. *Hothead*: +power, +heat on fail; *Discreet*:
  −heat; *Greedy*: +wage, +income when staffing).
- LLM generates name + one-line bio at hire time (same pattern as mission narration).

**Recruitment:** a hiring pool of 4–6 candidates refreshed daily (mirrors the job board),
drawn by player level. Hire cost ≈ 10–20× daily wage. Roster cap grows with rank
(street_hustler: 2 → city_kingpin: 20).

**Crew equipment — the recurring cash sink:**
- Each crew member has a **simplified loadout: 2–3 slots** (`hand` weapon, `torso` armor,
  optional `waist` utility) — deliberately not the full 5-slot player loadout, so managing
  20 soldiers stays one decision per soldier ("is Vito armed and vested?"), not
  inventory micromanagement.
- Items come from the **existing 111-item catalog and store** — same schemas, same
  `power`/`armor`/`effects[]` math, same level gates (against the crew member's
  `skillLevel`). No new item system needed.
- Crew gear contributes to their power on jobs and to attack/defense strength in PvP —
  arming the crew is the military budget of the endgame, and the arms race between
  families is a self-renewing sink.
- **Gear is lost when a crew member is killed, and confiscated when arrested** (recoverable
  via a prison-bribe variant at a steep price). This converts equipment from a one-time
  purchase into a recurring sink and gives disaster-tier outcomes and lost battles real
  economic teeth. Sending your best-equipped capo on a risky job is a genuine gamble.
- Well-equipped crew gain loyalty slowly; under-equipped crew on dangerous work lose it.

**Mechanics:**
- **On jobs:** bring up to N crew (scales with leadership). Each grants a skill bonus on
  matching checks — implemented exactly like equipment `effects[]` through
  `calculateLoadoutBonuses`. On `disaster`, crew can be injured, arrested, or killed
  alongside you (with their gear on the line, per above).
- **Wages:** deducted on the lazy game-clock tick. Can't pay → loyalty drops → desertion
  (walks off with their gear), or worst case a *rat* (one-time heat spike + newspaper story).
- **Training:** spend cash + time to raise `skillLevel` (opportunity cost: trainee is busy).

**Pages:** `/crew` — roster table (design system already has the "Crew ledger" table pattern),
candidate pool, detail drawer (assign / equip / train / heal / fire). Equip flow reuses the
loadout drag-and-drop pattern from `/loadout`. Add a crew-picker step to mission accept
in `MissionRunner`.

**Server:** `CrewService`, `RecruitmentService` (class-based, DI via container), endpoints
under `/crew/*`. Wage settlement folded into the existing lazy `normalizePlayer`-style tick.
Crew equip/unequip mirrors `LoadoutService`.

---

## System 2 — Buildings: three classes

Buildings are not one system but three, on a safety-vs-value spectrum. Catalog seeded
like `equipments.json` (`buildingCatalog` collection).

### Class A — Personal holdings (off-map, safe)
- **What:** fronts and utility buildings — Laundromat, Pizzeria, Taxi Co., Pawn Shop,
  Safehouse (crew heal speed), Warehouse (stash capacity).
- **Rules:** a small, rank-gated set of slots (crew_leader: 1 → city_kingpin: ~4). Bought
  with cash, **never lootable, never conquerable**. Low income; fronts passively reduce heat.
- **Why:** the income floor. A player who loses every turf still has fronts, crew, and the
  entire jobs loop — they rebuild instead of churning. Also the first building a new
  player buys, long before the map matters to them.

### Class B — Map buildings (built on turf, captured with it)
- **What:** the big rackets — Strip Club, Speakeasy, Casino, Chop Shop, Drug Lab, Loan
  Office, Fight Club, Smuggling Dock.
- **Rules:** built on the building slots (1–3) of turf you control. High income, generate
  heat. When the turf flips, the attacker **captures the building in a damaged state**:
  it drops one level and produces nothing until repaired (repair cost ≈ 30–40% of the
  level price — itself a sink). Stored uncollected income on the turf is skimmed by the
  attacker.
- **Why capture, not destroy:** destruction shrinks the world economy and feels bad;
  capture keeps the pie and moves it around, and the repair cost keeps a flip from being
  free value transfer. Rich turf becomes a juicy, *named* target — you don't attack tile
  #47, you attack "the Marchetti strip club" — which is exactly the incentive and the
  fantasy we want.

### Class C — Landmark buildings (one-of-a-kind, conquest-only)
- **What:** unique named buildings that exist on the map from season start, **NPC-held,
  and can only be taken by force — never bought**: The Grand Casino (Neon Strip),
  the Port smuggling operation (The Docks), the Union Hall (Ironworks), etc. These
  merge with the points-of-interest concept: each landmark grants its district-wide or
  citywide perk (see map section).
- **Rules:** high defense (NPC garrison scales through the season), always front-page
  news when attacked or flipped. Captured like Class B (damaged state, repair), but
  cannot be built or replaced — there is exactly one of each per city.
- **Why:** mid-season war objectives, and the direct answer to "some things money can't
  buy — you take them."

**Economy shape** (tuned against mission payouts of ~$85–400 early, ~$6.5k–10k endgame):
- First front costs ~$4–6k (a few days of mid-early missions). Endgame Class B casino
  ~$500k+ to build and level.
- Income accrues hourly on the game clock, computed lazily on read (fits the no-cron
  architecture), **capped at 8h of storage** — uncollected income stops accruing, and
  stored cash is what raiders/attackers skim.
- **Staffing:** each building has crew slots; a matching-archetype crew member multiplies
  income (Face in the Strip Club, Wirehead in the Casino). Unstaffed = 40% output.
  Crew assigned to a Class B building also count toward its turf's defense.
- **Upgrades:** levels 1–5, each raising income, storage cap, and defense contribution.
- **Police raids:** heat above a threshold risks a raid on your highest-heat racket
  (income seized, building closed for hours, staff arrested). Corruption skill + Fixer
  crew + precinct bribes (existing system) mitigate. Fronts (Class A) passively lower
  raid risk. This makes heat matter between missions.
- **Sink loop:** buildings are the faucet; wages, crew gear (and its loss), building
  levels, repairs after capture, and landmark sieges are the sinks that scale with it.

**Pages:** `/empire` — personal holdings + owned map buildings in one ledger: collect-all,
staffing, upgrade, repair. Building placement itself happens on `/map`.

**Server:** `BuildingService`, `IncomeService`. Firestore: `buildingCatalog`,
`players/{uid}/buildings` (Class A), Class B/C live on turf docs (see below) with an
owner index.

---

## System 3 — City map, districts & turf

**The city:** the 7 existing districts (Old Quarter, Downtown, Riverside, Ironworks,
The Docks, Hillcrest, Neon Strip), each split into 8–12 **turfs** → ~70 turfs citywide.
Turf is the atomic unit of control; districts are the strategic layer.

**Map tech:** a single hand-authored **grayscale SVG** (streets, blocks, water, landmarks) —
no game engine. Turf polygons get a low-opacity family-color fill + hatching for contested;
building icons render on their turf. Pan/zoom via viewBox. Grayscale base means player
colors are the only color on the page — strong noir look, cheap to build.

**Turf model** (shared world state — first multiplayer collection):
`seasons/{seasonId}/turfs/{turfId}`: `district`, `ownerUid | null`, `buildings[]`
(Class B instances: type, level, damaged, storedIncome), `landmark | null` (Class C),
`buildingSlots` (1–3), `incomeBonus`, `defense`, `assignedCrew` (defender's), `claimedAt`,
`shieldUntil`.

**Landmarks (Class C) as points of interest** — one per district, each granting a perk
to its controlling family:
- **Police Precinct HQ** (Downtown) — cheaper bribes, citywide.
- **The Port** (The Docks) — store discount / exclusive smuggled gear.
- **City Hall annex** (Old Quarter) — reduced building upkeep.
- **Hospital** (Hillcrest) — faster health/crew recovery.
- **The Grand Casino** (Neon Strip) — % rake of citywide gambling income.
- **Union Hall** (Ironworks) — crew wages discount.
- **Riverside Freight Yard** (Riverside) — mission stamina discount in adjacent districts.

**Claiming neutral turf:** generates a **takeover mission** through the existing engine
(seeded tree, difficulty from turf defense, `district` set accordingly). Win tier ≥
`partially_successful` → you plant your flag. This reuses the entire mission pipeline.

**District control bonus:** own >50% of a district's turfs → +15% income there; own all
of it → its **stronghold** activates (victory objective, see Seasons).

**Adjacency rule:** you may only claim/attack turf adjacent to turf you own (or anywhere
in your home district) — keeps the map readable and wars local.

**Pages:** `/map` — the centerpiece. Turf detail panel (owner, defense, buildings,
landmark perk, actions: claim / attack / build / assign crew), district summary sidebar,
legend of families. Mission `district` fields now link to real places the player can see.

**Server:** `TerritoryService`. Shared writes use Firestore transactions from day one.

---

## System 4 — Rival mafias (PvP)

Each player **is** a family (name + color chosen at map unlock). Alliances are a
post-launch layer (see backlog).

**Attacks — asynchronous, engine-resolved:**
1. Attacker targets an enemy turf (adjacency rule), commits crew + pays a stake.
2. Resolution is a seeded engine run: attacker force (player power + committed crew power
   **+ their gear**) vs. defense (turf defense + defender's assigned crew + gear + building
   levels), mapped onto the existing d100 check math. **No live defender required** —
   critical for an async web game.
3. Outcomes use the same 6 tiers: jackpot = turf flips, buildings captured damaged, stored
   income skimmed; partial = defense damaged (softened for a follow-up); disaster =
   attacker crew captured/killed (gear lost) + big heat + front-page humiliation.
4. Defender gets a full battle report and a 24h **revenge token** (attack back ignoring
   adjacency, −20% enemy defense).
5. **Landmark sieges** (Class C) use the same flow against the NPC garrison — the PvE
   on-ramp to the PvP system, and always newsworthy.

**Anti-snowball / new-player protection:**
- New/returning players: 72h shield; freshly flipped turf: 8h shield.
- **Upkeep scales superlinearly with turf count** — overextended empires bleed cash and
  loyalty, creating comeback windows.
- Attacking generates heat; a citywide "police crackdown" (newspaper event) punishes the
  most aggressive family each week.
- **Losing everything on the map never touches the core loop** — jobs, crew, and Class A
  personal holdings survive, so a wiped-out player rebuilds rather than quits.

**Infrastructure:** this system introduces the first real **scheduled work**
(Cloud Scheduler → authed endpoints): attack resolution windows, shield expiry, NPC
garrison scaling, weekly crackdown. Everything player-scoped stays lazy-on-read.

**Server:** `AttackService`, battle reports in `seasons/{id}/battles`, and a
notifications feed (`players/{uid}/notifications`) — "you were attacked" must be loud.

---

## System 5 — Seasons & the win condition

**Season:** 8–10 weeks. All players in one city (shard into multiple city instances
later if population demands).

**Winning "the whole city"** — literal 100% ownership is a stalemate magnet with real
players, so victory is layered:
- **Conquest victory (instant win):** hold all 7 district **strongholds** simultaneously
  for 72 consecutive hours. The countdown is public — front-page news — so the city gets
  a chance to unite against the leader. This is the dramatic "conquer the city" fantasy.
- **Respect victory (fallback):** if no conquest by season end, highest **Respect** wins.
  Respect accrues from turf-hours held (weighted by district), battles won, landmarks
  controlled, jackpot missions. Leaderboard on `/rankings`.

**Season end & reset:**
- Resets: turf ownership, Class B/C buildings (partial cash-out refund for Class B owners),
  Respect. Landmarks return to NPC garrisons.
- Persists: player level/skills, equipment, Class A personal holdings, crew roster **and
  their gear** (a "loyalty test" event culls the disloyal — fun narrative beat), cash
  (soft-capped via cash-out tax to prevent turn-1 domination next season).
- **Legacy rewards:** winner's family name engraved in the newspaper masthead for the next
  season, cosmetic titles ("Kingpin of Season 3"), unique vanity equipment. Meta-progression
  stays cosmetic/light so new players can always compete.

**Server:** `SeasonService` (lifecycle, scoring cron, reset job), `seasons/{id}` root doc,
`respect` ledger.

---

## System 6 — The newspaper: *The City Ledger*

The soul of the multiplayer game — how players feel the world moving without being online.

**Content sources (all already-structured events):**
- Per-player `narrativeEvents` (exists today) — jackpots, disasters, arrests, prison escapes.
- New world events: turf flips, battles, landmark sieges, raids, stronghold countdowns,
  season standings, crackdown announcements.

**Format:** a daily edition (game clock = 1 day/real hour → publish per real day or per
few game-days — tune to content volume). Structure: front-page headline (biggest event
by weight), war reports, crime blotter (funny disaster-tier fails, anonymized as "a masked
crew…" unless jackpot-famous), business section (district income trends, store events),
season standings, obituaries/arrests, and a **classifieds section that is actually
gameplay**: bounties ("City Hall offers $X for hits on Family Y's turf"), rare-equipment
store drops, limited-time mission modifiers ("Docks on strike: +30% payouts, +heat").

**Generation:** a scheduled job aggregates the event window, picks top stories by weight,
and has `gpt-5.4-mini` write copy in period voice — same facts-in/prose-out pattern as
`AiNarratorService`, zod-validated. One LLM call per edition (cheap), stored in
`newspaper/{editionId}`, served to everyone.

**Page:** `/newspaper` — newsprint-styled (the grayscale aesthetic doubles down here),
archive of past editions. Front page teaser embedded on the home page.

---

## Engagement systems (cross-cutting)

- **Notifications & catch-up:** login summary ("while you were away: 2 attacks, $3.4k
  collected, Vito recovered"). Attacked-while-away must never feel silent.
- **Weekly world events** (via newspaper): police crackdowns, dock strikes, high-roller
  weekends (casino income ×2), gang war amnesties (attack costs −50%). One scheduled
  config doc drives them.
- **Bounty board:** system- and player-posted bounties on turfs/players — gives losing
  players income and leaders pressure.
- **Onboarding funnel guard:** every system unlocks via the rank ladder with a
  one-mission tutorial (first hire is a scripted cheap candidate; first turf claim is a
  guaranteed-adjacent weak turf). Solo players who ignore PvP can still enjoy
  jobs + crew + Class A holdings indefinitely.

---

## Technical plan

**New Firestore collections**
- `players/{uid}/crew` (with per-member loadout), `players/{uid}/buildings` (Class A),
  `players/{uid}/notifications`
- `buildingCatalog`, `crewNamePools` (top-level, seeded)
- `seasons/{id}` + subcollections `turfs` (embedding Class B/C buildings), `battles`, `respect`
- `newspaper/{editionId}`

**New server services** (class-based, per convention): `CrewService`,
`RecruitmentService`, `BuildingService`, `IncomeService`, `TerritoryService`,
`AttackService`, `SeasonService`, `NewspaperService`, `NotificationService`.

**New client routes:** `/crew`, `/empire`, `/map`, `/newspaper`, `/rankings`.

**Architecture shifts to flag early**
1. **Shared world state** — first time two players write the same doc. Firestore
   transactions on every turf/battle mutation; deterministic engine-seeded resolution
   avoids realtime sync entirely.
2. **Scheduled jobs** — attack windows, shields, NPC garrisons, crackdowns, newspaper,
   season lifecycle. Cloud Scheduler hitting authed endpoints keeps the current
   architecture; player-scoped mechanics stay lazy-on-read as today.
3. **Map freshness** — start with polling `/map` (30–60s) via existing REST; upgrade to
   SSE/listeners only if it feels stale.
4. **Economy telemetry** — log income/spend events from day one so building vs. mission
   earnings, gear-loss rates, and repair costs can be tuned with data, not vibes.

## Build order (single release — internal sequencing, not shipping milestones)

Everything ships together at season launch; this orders the work so each layer has its
dependencies ready and can be playtested internally as it lands.

1. **Foundations:** shared schemas (crew, buildings, turf, season), `buildingCatalog` +
   crew seed data, season scaffolding doc, economy telemetry hooks.
2. **Crew + crew equipment:** the deepest integration with existing code (engine bonuses,
   loadout reuse, MissionRunner picker) — de-risk it first. Internally playtestable
   against solo missions immediately.
3. **Buildings (all three classes) + income + raids:** Class A end-to-end; Class B/C data
   model lands with turf docs even before the map UI exists.
4. **Map + territory:** SVG city, turf claiming via takeover missions, building placement,
   district bonuses.
5. **PvP + scheduled infrastructure:** attack resolution, landmark sieges, shields,
   notifications, Cloud Scheduler setup.
6. **Seasons + newspaper + rankings:** victory tracking, reset job, Ledger generation,
   world events, bounties. These consume events from every other system, so they land last.
7. **Balance pass + closed playtest** before the public season starts: tune income vs.
   mission payouts, gear-loss economy, upkeep curve, NPC garrison difficulty.

**Backlog (post-launch):** alliances & shared family banks (politics layer — design after
real PvP data), dirty-vs-clean money laundering, crew permadeath toggle, player-to-player
market/trading, multiple city shards, spectator mode for the stronghold countdown.
