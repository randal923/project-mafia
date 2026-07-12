import "server-only";

import {
  isPlayerLanguage,
  PLAYER_LANGUAGE_COOKIE,
  type PlayerLanguage,
} from "@shared/language";
import { playerLanguageFromHeader } from "@shared/playerLanguageFromHeader";
import { cookies, headers } from "next/headers";

export async function getRequestLanguage(): Promise<PlayerLanguage> {
  const cookieLanguage = (await cookies()).get(PLAYER_LANGUAGE_COOKIE)?.value;
  if (isPlayerLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  return playerLanguageFromHeader(
    (await headers()).get("accept-language") ?? undefined,
  );
}
