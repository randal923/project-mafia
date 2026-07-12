/**
 * Player-facing event feed at players/{uid}/notifications. Being attacked
 * while away must never be silent — the login catch-up reads from here.
 */
export const NOTIFICATION_TYPES = [
  "bounty_posted",
  "building_raided",
  "crew_deserted",
  "crew_died",
  "crew_rat",
  "crew_recovered",
  "crew_released",
  "season",
  "turf_attacked",
  "turf_defended",
  "turf_lost",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type PlayerNotification = {
  body: string;
  createdAt: string;
  /** Cross-reference (battle id, turf id, member id) for deep links. */
  refId: string | null;
  id: string;
  read: boolean;
  title: string;
  type: NotificationType;
};

/** How many recent notifications list endpoints return. */
export const NOTIFICATION_PAGE_SIZE = 50;
