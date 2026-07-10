import type { MissionResolution, MissionViewStep } from "@shared/job";
import { displayText, typography } from "../../design-system/typography";
import { toneTextClasses } from "../../design-system/tones";
import { Button } from "../Button/Button";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { outcomeTierLabels, outcomeTierTones } from "./MissionRunnerHelpers";

type MissionOutcomePanelProps = {
  onFinish: () => void;
  resolution: MissionResolution;
  step: MissionViewStep;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

export function MissionOutcomePanel({
  onFinish,
  resolution,
  step
}: MissionOutcomePanelProps) {
  const tone = outcomeTierTones[resolution.tier];

  return (
    <div className="flex flex-col gap-5">
      <p className={`m-0 ${displayText} text-2xl ${toneTextClasses[tone]}`}>
        {outcomeTierLabels[resolution.tier]}
      </p>
      <h2 className={`m-0 ${displayText} text-4xl text-title`}>
        {step.narrative?.title ?? "The job is over"}
      </h2>
      <OrnamentDivider />
      <p className={`m-0 ${typography.narrativeBody}`}>
        {step.narrative?.body}
      </p>
      <dl className="m-0 flex flex-wrap gap-8">
        <div>
          <dt className={typography.metadata}>Take</dt>
          <dd className={`m-0 ${displayText} text-2xl text-profit`}>
            {moneyFormatter.format(resolution.cashChange)}
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>Heat</dt>
          <dd className={`m-0 ${displayText} text-2xl text-danger-strong`}>
            +{resolution.heatChange}
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>Experience</dt>
          <dd className={`m-0 ${displayText} text-2xl text-brass`}>
            +{resolution.xpChange}
          </dd>
        </div>
      </dl>
      <div className="flex justify-end">
        <Button onClick={onFinish}>Back to the board</Button>
      </div>
    </div>
  );
}
