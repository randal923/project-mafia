import type { DistrictId } from "./district";

/**
 * World events are the newspaper's raw feed: plain structured facts
 * emitted by every system (battles, raids, flips, crackdowns). The LLM
 * writes prose AROUND them at edition time; it never decides them.
 */
export const WORLD_EVENT_TYPES = [
  "battle",
  "building_raided",
  "crackdown",
  "crew_rat",
  "landmark_captured",
  "season_end",
  "stronghold_countdown",
  "stronghold_countdown_broken",
  "turf_captured",
  "turf_claimed",
] as const;

export type WorldEventType = (typeof WORLD_EVENT_TYPES)[number];

/** How loudly each event type argues for the front page. */
export const WORLD_EVENT_WEIGHTS: Record<WorldEventType, number> = {
  battle: 30,
  building_raided: 25,
  crackdown: 60,
  crew_rat: 15,
  landmark_captured: 80,
  season_end: 100,
  stronghold_countdown: 100,
  stronghold_countdown_broken: 100,
  turf_captured: 40,
  turf_claimed: 10,
};

export type WorldEvent = {
  /** Whose action made the news; null for city acts (crackdowns). */
  actorName: string | null;
  actorUid: string | null;
  createdAt: string;
  district: DistrictId | null;
  id: string;
  seasonId: string;
  /** One plain factual sentence — the LLM's source of truth. */
  summary: string;
  targetName: string | null;
  targetUid: string | null;
  type: WorldEventType;
  weight: number;
};

export const NEWSPAPER_SECTIONS = [
  "business",
  "crime_blotter",
  "front_page",
  "season",
  "war_report",
] as const;

export type NewspaperSection = (typeof NEWSPAPER_SECTIONS)[number];

export type NewspaperArticle = {
  body: string;
  section: NewspaperSection;
  title: string;
};

export type NewspaperCopy = {
  articles: NewspaperArticle[];
  headline: NewspaperArticle;
};

/**
 * Classifieds are gameplay, not flavor: bounties to collect, limited
 * store drops, and district modifiers the next editions announce.
 */
export type NewspaperClassified =
  | {
      /** Cash the city pays per successful hit on the target's turf. */
      bounty: number;
      targetName: string;
      targetUid: string;
      text: string;
      type: "bounty";
    }
  | {
      district: DistrictId;
      /** Multipliers active while the modifier runs. */
      heatFactor: number;
      payoutFactor: number;
      text: string;
      type: "mission_modifier";
      until: string;
    }
  | {
      equipmentId: string;
      /** Discount factor while the drop lasts. */
      priceFactor: number;
      text: string;
      type: "store_drop";
      until: string;
    };

export type NewspaperStanding = {
  familyColor: string;
  familyName: string;
  respect: number;
  turfCount: number;
};

/** One published edition, at newspaper/{editionId}. Served to everyone. */
export type NewspaperEdition = {
  articles: NewspaperArticle[];
  classifieds: NewspaperClassified[];
  /** In-game day stamp for the masthead. */
  gameDay: number;
  headline: NewspaperArticle;
  id: string;
  /** Reigning champion engraved on the masthead, if any. */
  mastheadChampion: string | null;
  /** Brazilian Portuguese copy. Absent on editions published before localization. */
  ptBR?: NewspaperCopy;
  publishedAt: string;
  seasonId: string;
  standings: NewspaperStanding[];
};

export const NEWSPAPER_NAME = "The City Ledger";

/** Real hours between editions. */
export const EDITION_INTERVAL_HOURS = 24;

/** Cap on stories per edition — the rest of the window goes unreported. */
export const MAX_ARTICLES_PER_EDITION = 8;
