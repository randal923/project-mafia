import { createHash } from "node:crypto";

/**
 * Deterministic randomness scoped to one mission. Everything random in a
 * mission flows through here, so a mission is fully reproducible from
 * (seed, missionId).
 */
export class MissionRng {
  constructor(
    private readonly seed: string,
    private readonly missionId: string,
  ) {}

  /** Deterministic 32-bit value for a scope label. */
  hashValue(scope: string): number {
    return createHash("sha256")
      .update(`${this.seed}:${this.missionId}:${scope}`)
      .digest()
      .readUInt32BE(0);
  }

  /** Deterministic d100 roll, 1-100. */
  rollD100(scope: string): number {
    return (this.hashValue(scope) % 100) + 1;
  }

  /** Deterministically picks `count` distinct items from a pool. */
  pickDistinct<T>(pool: readonly T[], count: number, scope: string): T[] {
    const remaining = [...pool];
    const picked: T[] = [];

    for (let i = 0; i < count && remaining.length > 0; i += 1) {
      const index = this.hashValue(`${scope}:${i}`) % remaining.length;
      picked.push(...remaining.splice(index, 1));
    }

    return picked;
  }
}
