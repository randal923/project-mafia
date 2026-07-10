import { MAX_STAMINA } from "./player";

/** Stamina regained per real hour of idle time (see also heat.ts decay). */
export const STAMINA_REGEN_PER_HOUR = 25;

export function regeneratedStamina(
  stamina: number,
  updatedAtIso: string,
  nowIso: string,
): number {
  const elapsedMs = Date.parse(nowIso) - Date.parse(updatedAtIso);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return stamina;
  }

  const hours = elapsedMs / 3_600_000;
  return Math.min(
    MAX_STAMINA,
    stamina + Math.floor(hours * STAMINA_REGEN_PER_HOUR),
  );
}
