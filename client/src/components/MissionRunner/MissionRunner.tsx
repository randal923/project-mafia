import type { MissionView } from "@shared/job";
import { typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { NarrativeCard } from "../NarrativeCard/NarrativeCard";
import { MissionCheckBadge } from "./MissionCheckBadge";
import { MissionOutcomePanel } from "./MissionOutcomePanel";
import {
  currentStep,
  isWaitingOnNarration
} from "./MissionRunnerHelpers";

type MissionRunnerProps = {
  isChoosing: boolean;
  mission: MissionView;
  onChoose: (choiceId: string) => void;
  onFinish: () => void;
};

export function MissionRunner({
  isChoosing,
  mission,
  onChoose,
  onFinish
}: MissionRunnerProps) {
  const step = currentStep(mission);
  const beatNumber = mission.steps.length;
  const totalBeats = mission.depth + 1;

  return (
    <NarrativeCard
      district={mission.offer.district}
      kicker={mission.offer.storySeed.location}
      priority={step.edgeTaken && !step.edgeTaken.passed ? "urgent" : "standard"}
      timeLabel={
        mission.status === "resolved"
          ? "Job complete"
          : isWaitingOnNarration(mission)
            ? "Casing the place…"
            : `Beat ${beatNumber} of ${totalBeats}`
      }
      title={
        mission.status === "resolved"
          ? "The dust settles"
          : isWaitingOnNarration(mission)
            ? "Setting up the job…"
            : (step.narrative?.title ?? "Setting up the job…")
      }
    >
      {mission.status === "resolved" && mission.resolution ? (
        <MissionOutcomePanel
          onFinish={onFinish}
          resolution={mission.resolution}
          step={step}
        />
      ) : isWaitingOnNarration(mission) ? (
        <div className="flex flex-col gap-3">
          <p className={`m-0 ${typography.narrativeBody}`}>
            The fixer is working out the details…
          </p>
          <p className={`m-0 ${typography.metadata}`}>
            {mission.narrativeProgress.ready} of{" "}
            {mission.narrativeProgress.total} scenes ready
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {step.edgeTaken ? <MissionCheckBadge edge={step.edgeTaken} /> : null}
          <p className={`m-0 ${typography.narrativeBody}`}>
            {step.narrative?.body}
          </p>
          {step.narrative?.stakes ? (
            <p className={`m-0 ${typography.leadBody}`}>
              {step.narrative.stakes}
            </p>
          ) : null}
          {mission.choices ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {mission.choices.map((choice) => (
                <div className="flex flex-col gap-2" key={choice.id}>
                  <Button
                    className="w-full"
                    disabled={isChoosing}
                    font="narrative"
                    onClick={() => onChoose(choice.id)}
                    size="small"
                    variant="secondary"
                  >
                    {choice.label ?? choice.approach}
                  </Button>
                  {choice.gear ? (
                    <span
                      className={cx(
                        "inline-flex w-fit items-center rounded-control border px-2 py-1 text-sm font-medium leading-none",
                        choice.gear.satisfied
                          ? "border-profit/60 text-profit"
                          : "border-danger/60 text-danger-strong"
                      )}
                    >
                      {choice.gear.satisfied
                        ? `Gear ready: ${choice.gear.label}${choice.gear.consumes ? " (will be used)" : ""}`
                        : `No ${choice.gear.label.toLowerCase()} — improvising, harder odds`}
                    </span>
                  ) : null}
                  <p className={`m-0 ${typography.narrativeCaption}`}>
                    {choice.riskHint ??
                      `Tests your ${choice.check.skill} (difficulty ${choice.check.difficulty}).`}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </NarrativeCard>
  );
}
