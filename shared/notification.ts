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

export const NOTIFICATION_MESSAGE_IDS = [
  "building_raided",
  "crew_deserted",
  "crew_died_on_job",
  "crew_imprisoned_on_job",
  "crew_injured_on_job",
  "crew_ratted",
  "crew_recovered",
  "crew_released",
  "season_crackdown",
  "turf_defended",
  "turf_lost",
] as const;

export type NotificationMessageId = (typeof NOTIFICATION_MESSAGE_IDS)[number];

export type NotificationParametersByMessageId = {
  building_raided: { buildingId: string };
  crew_deserted: { name: string };
  crew_died_on_job: { name: string };
  crew_imprisoned_on_job: { name: string };
  crew_injured_on_job: { name: string };
  crew_ratted: { name: string };
  crew_recovered: { name: string };
  crew_released: { name: string };
  season_crackdown: { heat: number };
  turf_defended: { attackerName: string; turfId: string };
  turf_lost: { attackerName: string; turfId: string };
};

export type NotificationContent = {
  [MessageId in NotificationMessageId]: {
    messageId: MessageId;
    params: NotificationParametersByMessageId[MessageId];
  };
}[NotificationMessageId];

type NotificationTypeByMessageId = {
  building_raided: "building_raided";
  crew_deserted: "crew_deserted";
  crew_died_on_job: "crew_died";
  crew_imprisoned_on_job: "crew_released";
  crew_injured_on_job: "crew_recovered";
  crew_ratted: "crew_rat";
  crew_recovered: "crew_recovered";
  crew_released: "crew_released";
  season_crackdown: "season";
  turf_defended: "turf_defended";
  turf_lost: "turf_lost";
};

export type SemanticNotificationInput = {
  [MessageId in NotificationMessageId]: {
    content: Extract<NotificationContent, { messageId: MessageId }>;
    type: NotificationTypeByMessageId[MessageId];
  };
}[NotificationMessageId];

type PlayerNotificationBase = {
  createdAt: string;
  /** Cross-reference (battle id, turf id, member id) for deep links. */
  refId: string | null;
  id: string;
  read: boolean;
};

export type PlayerNotification = PlayerNotificationBase &
  (
    | SemanticNotificationInput
    | {
        body: string;
        content?: never;
        title: string;
        type: NotificationType;
      }
  );

/** How many recent notifications list endpoints return. */
export const NOTIFICATION_PAGE_SIZE = 50;
