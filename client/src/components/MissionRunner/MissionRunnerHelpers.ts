import type { MissionView, MissionViewStep, OutcomeTier } from "@shared/job";

export const outcomeTierLabels: Record<OutcomeTier, string> = {
  disaster: "Disaster",
  failure: "Failure",
  jackpot: "Jackpot",
  partial_failure: "Partial failure",
  partially_successful: "Partial success",
  successful: "Success"
};

export const outcomeTierTones: Record<OutcomeTier, "danger" | "profit"> = {
  disaster: "danger",
  failure: "danger",
  jackpot: "profit",
  partial_failure: "danger",
  partially_successful: "profit",
  successful: "profit"
};

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
