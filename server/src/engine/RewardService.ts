import { JobOffer, OutcomeTier } from "../../../shared/job";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { MAX_HEAT, Player, PlayerLoadout } from "../../../shared/player";
import { calculateLoadoutBonuses } from "../../../shared/playerPower";
import { LevelingService } from "./LevelingService";
import { clamp, roundToFive } from "./math";

export type MissionRewards = {
  cashChange: number;
  heatChange: number;
  xpChange: number;
};

export type AppliedRewards = {
  levelsGained: number;
  player: Player;
};

/**
 * The only place mission rewards are decided, from the template's per-tier
 * knobs (server/missions/*.yml). The LLM never touches these numbers.
 */
export class RewardService {
  static rewardsForTier(
    tier: OutcomeTier,
    offer: JobOffer,
    template: MissionTemplate,
  ): MissionRewards {
    const outcome = template.outcomes[tier];
    const { rewards } = template;

    return {
      cashChange: roundToFive(outcome.cashFactor * offer.rewardMax),
      heatChange:
        Math.ceil(outcome.heatFactor * offer.heatIncrease) + outcome.heatBonus,
      // `?? 0` keeps missions snapshotted before the xpBase knob resolvable.
      xpChange: Math.round(
        outcome.xpFactor *
          ((rewards.xpBase ?? 0) +
            offer.difficulty * (rewards.xpPerDifficulty ?? 0)),
      ),
    };
  }

  /**
   * Accept-time heat-reduction effects bleed off some of the heat a job
   * earns. Heat gained never drops below 1: there is no clean job.
   */
  static mitigateHeat(
    rewards: MissionRewards,
    acceptedLoadout: PlayerLoadout,
  ): MissionRewards {
    if (rewards.heatChange <= 1) {
      return rewards;
    }

    const soak = calculateLoadoutBonuses(acceptedLoadout).heatReduction;

    return {
      ...rewards,
      heatChange: Math.max(1, rewards.heatChange - soak),
    };
  }

  static applyToPlayer(
    player: Player,
    rewards: MissionRewards,
    nowIso: string,
  ): AppliedRewards {
    const leveled = LevelingService.addExperience(
      player,
      rewards.xpChange,
      nowIso,
    );

    return {
      levelsGained: leveled.levelsGained,
      player: {
        ...leveled.player,
        resources: {
          ...leveled.player.resources,
          cash: Math.max(0, player.resources.cash + rewards.cashChange),
          heat: clamp(player.resources.heat + rewards.heatChange, 0, MAX_HEAT),
        },
        updatedAt: nowIso,
      },
    };
  }
}
