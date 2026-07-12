import type { MissionView } from "@shared/job";
import type { PlayerItem } from "@shared/player";
import { useTranslations } from "next-intl";
import { typography } from "../../design-system/typography";
import { NarrativeCard } from "../NarrativeCard/NarrativeCard";
import { MissionCheckBadge } from "./MissionCheckBadge";
import { MissionAcceptedEquipment } from "./MissionAcceptedEquipment";
import { MissionChoiceCard } from "./MissionChoiceCard";
import { MissionMomentumMeter } from "./MissionMomentumMeter";
import { MissionOutcomePanel } from "./MissionOutcomePanel";
import { MissionHealthPanel } from "./MissionHealthPanel";
import {
  currentStep,
  isWaitingOnNarration
} from "./MissionRunnerHelpers";

type MissionRunnerProps = {
  isChoosing: boolean;
  healingError: string | null;
  healingItemId: string | null;
  health: number;
  healingItems: PlayerItem[];
  mission: MissionView;
  healthUpdatedAt: string;
  onChoose: (choiceId: string) => void;
  onFinish: () => void;
  onHeal: (itemId: string) => void;
};

export function MissionRunner({
  healingError,
  healingItemId,
  healingItems,
  health,
  healthUpdatedAt,
  isChoosing,
  mission,
  onChoose,
  onFinish,
  onHeal
}: MissionRunnerProps) {
  const t = useTranslations("mission");
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
          ? t("runner.jobComplete")
          : isWaitingOnNarration(mission)
            ? t("runner.casingThePlace")
            : t("runner.beatProgress", { beat: beatNumber, total: totalBeats })
      }
      title={
        mission.status === "resolved"
          ? t("runner.dustSettles")
          : isWaitingOnNarration(mission)
            ? t("runner.settingUp")
            : (step.narrative?.title ?? t("runner.settingUp"))
      }
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <MissionHealthPanel
          canHeal={mission.status !== "resolved" && mission.steps.length > 1}
          errorMessage={healingError}
          healingItemId={healingItemId}
          health={health}
          healthUpdatedAt={healthUpdatedAt}
          isBusy={isChoosing}
          items={healingItems}
          onHeal={onHeal}
        />
        <MissionAcceptedEquipment acceptedState={mission.acceptedState} />
      </div>
      {mission.momentum && !isWaitingOnNarration(mission) ? (
        <div className="mb-6">
          <MissionMomentumMeter momentum={mission.momentum} />
        </div>
      ) : null}
      {mission.status === "resolved" && mission.resolution ? (
        <div className="flex flex-col gap-5">
          {step.edgeTaken ? <MissionCheckBadge edge={step.edgeTaken} /> : null}
          <MissionOutcomePanel
            onFinish={onFinish}
            resolution={mission.resolution}
            step={step}
          />
        </div>
      ) : isWaitingOnNarration(mission) ? (
        <div className="flex flex-col gap-3">
          <p className={`m-0 ${typography.narrativeBody}`}>
            {t("runner.fixerWorking")}
          </p>
          <p className={`m-0 ${typography.metadata}`}>
            {t("runner.scenesReady", {
              ready: mission.narrativeProgress.ready,
              total: mission.narrativeProgress.total
            })}
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
                <MissionChoiceCard
                  choice={choice}
                  disabled={isChoosing}
                  key={choice.id}
                  onChoose={onChoose}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </NarrativeCard>
  );
}
