import type { MissionResolution, MissionViewStep } from "@shared/job";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { toneTextClasses } from "../../design-system/tones";
import { Button } from "../Button/Button";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { outcomeTierLabelKeys, outcomeTierTones } from "./MissionRunnerHelpers";
import { MissionSkillExperienceSummary } from "./MissionSkillExperienceSummary";
import { useFormatters } from "../../lib/useFormatters";

type MissionOutcomePanelProps = {
  onFinish: () => void;
  resolution: MissionResolution;
  step: MissionViewStep;
};

export function MissionOutcomePanel({
  onFinish,
  resolution,
  step
}: MissionOutcomePanelProps) {
  const t = useTranslations("mission");
  const { moneyFormatter } = useFormatters();
  const tone = outcomeTierTones[resolution.tier];

  return (
    <div className="flex flex-col gap-5">
      <p className={`m-0 ${displayText} text-2xl ${toneTextClasses[tone]}`}>
        {t(`outcomeTiers.${outcomeTierLabelKeys[resolution.tier]}`)}
      </p>
      <h2 className={`m-0 ${displayText} text-4xl text-title`}>
        {step.narrative?.title ?? t("outcome.jobOver")}
      </h2>
      <OrnamentDivider />
      <p className={`m-0 ${typography.narrativeBody}`}>
        {step.narrative?.body}
      </p>
      {resolution.levelsGained ? (
        <p
          className={`m-0 w-fit rounded-control border border-brass-bright bg-brass/10 px-4 py-2 ${displayText} text-2xl text-brass-bright`}
        >
          {t("outcome.levelUp")}
          {resolution.levelsGained > 1 ? ` ×${resolution.levelsGained}` : ""}
        </p>
      ) : null}
      <dl className="m-0 flex flex-wrap gap-8">
        <div>
          <dt className={typography.metadata}>{t("outcome.take")}</dt>
          <dd className={`m-0 ${displayText} text-2xl text-profit`}>
            {moneyFormatter.format(resolution.cashChange)}
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>{t("outcome.heat")}</dt>
          <dd className={`m-0 ${displayText} text-2xl text-danger-strong`}>
            +{resolution.heatChange}
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>{t("outcome.experience")}</dt>
          <dd className={`m-0 ${displayText} text-2xl text-brass`}>
            +{resolution.xpChange}
          </dd>
        </div>
      </dl>
      {resolution.skillExperienceGained ? (
        <MissionSkillExperienceSummary
          summary={resolution.skillExperienceGained}
        />
      ) : null}
      <div className="flex justify-end">
        <Button onClick={onFinish}>{t("outcome.backToBoard")}</Button>
      </div>
    </div>
  );
}
