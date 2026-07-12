import {
  CREW_NICKNAME_IDS,
  CREW_NICKNAMES,
} from "../../../shared/crewNames.ts";

export function formatCrewNameForLocale(
  name: string,
  translateNickname: (id: (typeof CREW_NICKNAME_IDS)[number]) => string,
): string {
  const index = CREW_NICKNAMES.findIndex(
    (nickname) => nickname && name.includes(`"${nickname}"`),
  );
  if (index < 1) {
    return name;
  }

  return name.replace(
    `"${CREW_NICKNAMES[index]}"`,
    `"${translateNickname(CREW_NICKNAME_IDS[index]!)}"`,
  );
}
