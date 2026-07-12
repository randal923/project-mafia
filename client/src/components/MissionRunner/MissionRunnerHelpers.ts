import type {
  MissionView,
  MissionViewStep,
  MomentumBands,
  OutcomeTier
} from "@shared/job";

/**
 * Message keys under the "mission.outcomeTiers" namespace — components
 * translate these via useTranslations.
 */
export const outcomeTierLabelKeys: Record<OutcomeTier, string> = {
  disaster: "disaster",
  failure: "failure",
  jackpot: "jackpot",
  partial_failure: "partialFailure",
  partially_successful: "partialSuccess",
  successful: "success"
};

export const outcomeTierTones: Record<OutcomeTier, "danger" | "profit"> = {
  disaster: "danger",
  failure: "danger",
  jackpot: "profit",
  partial_failure: "danger",
  partially_successful: "profit",
  successful: "profit"
};

/** Ascending tier order used by the momentum meter. */
export const MOMENTUM_TIER_ORDER: OutcomeTier[] = [
  "disaster",
  "failure",
  "partial_failure",
  "partially_successful",
  "successful",
  "jackpot"
];

/** Mirror of the server's band mapping, for the "on pace for" readout. */
export function tierForMomentum(
  momentum: number,
  bands: MomentumBands
): OutcomeTier {
  if (momentum > bands.jackpotAbove) return "jackpot";
  if (momentum >= bands.successfulAtLeast) return "successful";
  if (momentum >= bands.partiallySuccessfulAtLeast) {
    return "partially_successful";
  }
  if (momentum >= bands.partialFailureAtLeast) return "partial_failure";
  if (momentum >= bands.failureAtLeast) return "failure";
  return "disaster";
}

export function currentStep(mission: MissionView): MissionViewStep {
  return mission.steps[mission.steps.length - 1]!;
}

/**
 * True until the WHOLE mission is written. The player only starts reading
 * once every node is ready, so choices are always instant and can never
 * land on a beat that is still generating.
 */
export function isWaitingOnNarration(mission: MissionView): boolean {
  return (
    mission.status === "generating" || currentStep(mission).narrative === null
  );
}
