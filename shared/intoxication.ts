/**
 * Getting high or drunk: both restore stamina but build a buzz that
 * dulls your edge on jobs and blunts the next dose. One source of truth
 * for server math and client display.
 */

export const MAX_INTOXICATION = 100;

/** High/drunk sobered off per real hour of idle time. */
export const INTOX_DECAY_PER_HOUR = 20;

/**
 * Tolerance: at 100 high (or drunk), a dose restores only
 * (1 − TOLERANCE_FACTOR) of its printed stamina.
 */
export const TOLERANCE_FACTOR = 0.6;

/** −1% pass chance per this much high, and per this much drunk. */
export const INTOX_CHECK_DIVISOR = 10;

/** How much of a dose's stamina survives the current buzz. */
export function toleranceMultiplier(intoxication: number): number {
  const level = Math.min(MAX_INTOXICATION, Math.max(0, intoxication));
  return 1 - TOLERANCE_FACTOR * (level / MAX_INTOXICATION);
}

/** Combined pass-chance penalty from being high and/or drunk. */
export function intoxicationPenalty(high: number, drunk: number): number {
  return (
    Math.floor(Math.max(0, high) / INTOX_CHECK_DIVISOR) +
    Math.floor(Math.max(0, drunk) / INTOX_CHECK_DIVISOR)
  );
}

/** Sober-up over idle time, same clock pattern as heat decay. */
export function soberedIntoxication(
  level: number,
  updatedAtIso: string,
  nowIso: string,
): number {
  const elapsedMs = Date.parse(nowIso) - Date.parse(updatedAtIso);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return level;
  }

  const hours = elapsedMs / 3_600_000;
  return Math.max(0, level - Math.floor(hours * INTOX_DECAY_PER_HOUR));
}
