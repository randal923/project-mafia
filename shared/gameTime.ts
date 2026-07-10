/**
 * The city runs fast: ONE in-game day passes per real hour. Everything
 * time-flavored (the nav clock, prison sentences) derives from this
 * single scale so it can be retuned in one place.
 */
export const REAL_MS_PER_GAME_DAY = 3_600_000;

/**
 * Fallback epoch when no player exists yet. The real anchor is the
 * player's createdAt — every career begins on Day 1 at 00:00.
 */
export const GAME_EPOCH_MS = Date.parse("2026-07-10T00:00:00Z");

export type GameTime = {
  day: number;
  hour: number;
  minute: number;
};

export function gameTime(nowMs: number, epochMs = GAME_EPOCH_MS): GameTime {
  const elapsed = Math.max(0, nowMs - epochMs);
  const dayFraction =
    (elapsed % REAL_MS_PER_GAME_DAY) / REAL_MS_PER_GAME_DAY;
  const minutesIntoDay = Math.floor(dayFraction * 24 * 60);

  return {
    day: Math.floor(elapsed / REAL_MS_PER_GAME_DAY) + 1,
    hour: Math.floor(minutesIntoDay / 60),
    minute: minutesIntoDay % 60,
  };
}

export function formatGameClock(time: GameTime): string {
  const hh = String(time.hour).padStart(2, "0");
  const mm = String(time.minute).padStart(2, "0");
  return `Day ${time.day} · ${hh}:${mm}`;
}

/** Real milliseconds a sentence of `gameDays` lasts. */
export function gameDaysToRealMs(gameDays: number): number {
  return gameDays * REAL_MS_PER_GAME_DAY;
}
