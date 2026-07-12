/**
 * A season is one run at the city: 10 weeks, one shared map, one winner.
 * Territory resets between seasons; careers (levels, skills, crew, gear,
 * personal holdings) carry forward.
 */
export const SEASON_LENGTH_DAYS = 70;

export type SeasonStatus = "active" | "ended" | "upcoming";

export type SeasonVictoryType = "conquest" | "respect";

export type SeasonWinner = {
  familyColor: string;
  familyName: string;
  uid: string;
  victoryType: SeasonVictoryType;
};

/**
 * The public conquest clock: once a family holds all seven district
 * strongholds it starts, and if it survives CONQUEST_HOLD_HOURS the city
 * is theirs. Front-page news the whole way down.
 */
export type StrongholdCountdown = {
  familyName: string;
  startedAt: string;
  uid: string;
};

export type Season = {
  /** Last season's winner, engraved on the newspaper masthead. */
  champion: string | null;
  createdAt: string;
  endsAt: string;
  id: string;
  name: string;
  number: number;
  startsAt: string;
  status: SeasonStatus;
  strongholdCountdown: StrongholdCountdown | null;
  updatedAt: string;
  winner: SeasonWinner | null;
};

/** Watermarks for the scheduled tick, at seasons/{id}/meta/tick. */
export type SeasonTickMeta = {
  lastCrackdownAt: string;
  lastEditionAt: string;
  lastScoredAt: string;
};

/** The weekly police crackdown: the loudest family pays for the war. */
export const CRACKDOWN_INTERVAL_DAYS = 7;
export const CRACKDOWN_HEAT = 20;

/** Hours a family must hold all seven strongholds to take the city. */
export const CONQUEST_HOLD_HOURS = 72;

/**
 * Respect scoring weights. Turf-hours are the heartbeat (weighted by the
 * district's respectWeight); battles and landmarks are the headlines.
 */
export const RESPECT_WEIGHTS = {
  battleWon: 150,
  jackpotMission: 40,
  landmarkCaptured: 300,
  landmarkHour: 5,
  turfHour: 1,
} as const;

/** Standing per family, at seasons/{id}/respect/{uid}. */
export type RespectStanding = {
  familyColor: string;
  familyName: string;
  landmarkCount: number;
  respect: number;
  /** ISO time turf-hour respect last accrued. */
  scoredAt: string;
  turfCount: number;
  uid: string;
  updatedAt: string;
};

/** Season-end settlement: rackets refund a slice, big banks pay the tax. */
export const SEASON_RACKET_REFUND_FACTOR = 0.4;
export const SEASON_CASHOUT_TAX_THRESHOLD = 100000;
export const SEASON_CASHOUT_TAX = 0.5;
