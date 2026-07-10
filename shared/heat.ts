/**
 * Laying low: heat bleeds off with real idle time. The clock is the
 * player's updatedAt — any activity (jobs, shopping, equipping) resets
 * it, so decay only accrues while the player stays off the streets.
 */
export const HEAT_DECAY_PER_HOUR = 4;

export function decayedHeat(
  heat: number,
  updatedAtIso: string,
  nowIso: string,
): number {
  const elapsedMs = Date.parse(nowIso) - Date.parse(updatedAtIso);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return heat;
  }

  const hours = elapsedMs / 3_600_000;
  return Math.max(0, heat - Math.floor(hours * HEAT_DECAY_PER_HOUR));
}
