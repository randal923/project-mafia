export const MAX_HEALTH = 100;
export const MIN_HEALTH = 1;

/** Health recovered per real hour while the player is idle. */
export const HEALTH_RECOVERY_PER_HOUR = 10;

/** Failed risky choices deal 1 damage per this much check difficulty. */
export const DAMAGE_DIFFICULTY_DIVISOR = 5;

/** Equipped armor absorbs 1 damage per this much armor, rounded up. */
export const ARMOR_SOAK_DIVISOR = 30;

export function recoveredHealth(
  health: number,
  updatedAtIso: string,
  nowIso: string,
): number {
  const elapsedMs = Date.parse(nowIso) - Date.parse(updatedAtIso);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return health;
  }

  const hours = elapsedMs / 3_600_000;
  return Math.min(
    MAX_HEALTH,
    health + Math.floor(hours * HEALTH_RECOVERY_PER_HOUR),
  );
}
