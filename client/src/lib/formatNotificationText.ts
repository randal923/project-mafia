import type {
  NotificationContent,
  PlayerNotification,
} from "@shared/notification";
import type { PlayerLanguage } from "@shared/language";

type NotificationText = {
  body: string;
  title: string;
};

type NotificationTranslationValues = {
  attackerName?: string;
  building?: string;
  heat?: number;
  name?: string;
  turf?: string;
};

type NotificationTextOptions = {
  buildingName: (id: string) => string;
  crewName: (name: string) => string;
  language: PlayerLanguage;
  translate: (
    key: string,
    values?: NotificationTranslationValues,
  ) => string;
  turfName: (id: string) => string;
};

export function formatNotificationText(
  notification: PlayerNotification,
  options: NotificationTextOptions,
): NotificationText {
  const content = notification.content;
  if (!content) {
    if (options.language === "en" && "title" in notification) {
      return { body: notification.body, title: notification.title };
    }
    return {
      body: options.translate(`legacy.${notification.type}.body`),
      title: options.translate(`legacy.${notification.type}.title`),
    };
  }

  const render = (
    messageId: NotificationContent["messageId"],
    values: NotificationTranslationValues,
  ): NotificationText => ({
    body: options.translate(`messages.${messageId}.body`, values),
    title: options.translate(`messages.${messageId}.title`, values),
  });

  switch (content.messageId) {
    case "building_raided":
      return render(content.messageId, {
        building: options.buildingName(content.params.buildingId),
      });
    case "turf_defended":
    case "turf_lost":
      return render(content.messageId, {
        attackerName: content.params.attackerName,
        turf: options.turfName(content.params.turfId),
      });
    case "crew_deserted":
    case "crew_died_on_job":
    case "crew_imprisoned_on_job":
    case "crew_injured_on_job":
    case "crew_ratted":
    case "crew_recovered":
    case "crew_released":
      return render(content.messageId, {
        name: options.crewName(content.params.name),
      });
    default:
      return render(content.messageId, content.params);
  }
}
