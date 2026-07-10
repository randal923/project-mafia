import {
  ARMOR_SOAK_DIVISOR,
  DAMAGE_DIFFICULTY_DIVISOR,
  MAX_HEALTH,
  MIN_HEALTH,
} from "../../../shared/health";
import { EdgeDamage } from "../../../shared/job";
import { Player } from "../../../shared/player";

export class HealthService {
  static damageForFailure(difficulty: number, armor: number): EdgeDamage {
    const incoming = Math.ceil(difficulty / DAMAGE_DIFFICULTY_DIVISOR);
    const absorbed = Math.min(
      incoming,
      Math.ceil(Math.max(0, armor) / ARMOR_SOAK_DIVISOR),
    );

    return {
      absorbed,
      healthLost: incoming - absorbed,
      incoming,
    };
  }

  static applyDamage(
    player: Player,
    damage: EdgeDamage | null | undefined,
    nowIso: string,
  ): Player {
    if (!damage || damage.healthLost <= 0) {
      return player;
    }

    return {
      ...player,
      resources: {
        ...player.resources,
        health: Math.max(MIN_HEALTH, player.resources.health - damage.healthLost),
      },
      updatedAt: nowIso,
    };
  }

  static damageAtCurrentHealth(
    damage: EdgeDamage | null | undefined,
    health: number,
  ): EdgeDamage | null {
    if (!damage) {
      return null;
    }

    return {
      ...damage,
      healthLost: Math.min(
        damage.healthLost,
        Math.max(0, health - MIN_HEALTH),
      ),
    };
  }

  static heal(player: Player, amount: number, nowIso: string): Player {
    return {
      ...player,
      resources: {
        ...player.resources,
        health: Math.min(MAX_HEALTH, player.resources.health + amount),
      },
      updatedAt: nowIso,
    };
  }
}
