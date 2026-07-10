import { JobOffer, OutcomeTier } from "../../../shared/job";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { MAX_HEAT, Player } from "../../../shared/player";
import { clamp, roundToFive } from "./math";

export type MissionRewards = {
  cashChange: number;
  heatChange: number;
  xpChange: number;
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

    return {
      cashChange: roundToFive(outcome.cashFactor * offer.rewardMax),
      heatChange:
        Math.ceil(outcome.heatFactor * offer.heatIncrease) + outcome.heatBonus,
      xpChange: Math.round(
        outcome.xpFactor * offer.difficulty * template.rewards.xpPerDifficulty,
      ),
    };
  }

  static applyToPlayer(
    player: Player,
    rewards: MissionRewards,
    nowIso: string,
  ): Player {
    return {
      ...player,
      progression: {
        ...player.progression,
        experience: player.progression.experience + rewards.xpChange,
      },
      resources: {
        ...player.resources,
        cash: Math.max(0, player.resources.cash + rewards.cashChange),
        heat: clamp(player.resources.heat + rewards.heatChange, 0, MAX_HEAT),
      },
      updatedAt: nowIso,
    };
  }
}
