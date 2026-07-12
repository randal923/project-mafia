import {
  RECRUITMENT_REFRESH_HOURS,
  type CrewRecruitmentPool,
} from "../../../shared/crew";
import {
  DEFAULT_PLAYER_LANGUAGE,
  type PlayerLanguage,
} from "../../../shared/language";

export function isRecruitmentPoolCurrent(
  pool: CrewRecruitmentPool,
  language: PlayerLanguage,
  nowMs = Date.now(),
): boolean {
  const ageMs = nowMs - Date.parse(pool.generatedAt);

  return (
    ageMs >= 0 &&
    ageMs < RECRUITMENT_REFRESH_HOURS * 3_600_000 &&
    (pool.language ?? DEFAULT_PLAYER_LANGUAGE) === language
  );
}
