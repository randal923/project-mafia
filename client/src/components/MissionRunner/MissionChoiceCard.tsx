import type { MissionViewChoice } from "@shared/job";
import { SKILLS } from "@shared/skills";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { MissionCheckBreakdown } from "./MissionCheckBreakdown";

type MissionChoiceCardProps = {
  choice: MissionViewChoice;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
};

export function MissionChoiceCard({
  choice,
  disabled,
  onChoose,
}: MissionChoiceCardProps) {
  const matchedItem = choice.gear?.item?.name ?? choice.gear?.label;
  const equipmentStatus = !choice.gear
    ? "No equipment required — odds shown as-is"
    : !choice.gear.satisfied
      ? `Missing: ${choice.gear.label} — penalty included in odds`
      : choice.gear.consumes
        ? `Ready: ${matchedItem} — consumed on use; its power is included in this choice only`
        : `Ready: ${matchedItem} — reusable; readiness is included in the odds`;

  return (
    <article className="flex flex-col gap-3 rounded-panel border border-line bg-black/30 p-4">
      <Button
        className="w-full"
        disabled={disabled}
        font="narrative"
        onClick={() => onChoose(choice.id)}
        size="small"
        variant="secondary"
      >
        {choice.label ?? choice.approach}
      </Button>
      <p className={`m-0 ${typography.narrativeCaption}`}>
        {choice.riskHint ??
          choice.intent ??
          `Tests ${SKILLS[choice.check.skill].label}.`}
      </p>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-3">
        <div>
          <dt className={typography.metadata}>Skill</dt>
          <dd className={`m-0 ${displayText} text-xl text-brass`}>
            {SKILLS[choice.check.skill].label}
          </dd>
        </div>
        <div className="text-right">
          <dt className={typography.metadata}>Difficulty</dt>
          <dd className={`m-0 ${displayText} text-xl text-ink`}>
            {choice.check.difficulty} / 100
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>Success</dt>
          <dd className={`m-0 ${displayText} text-xl text-profit`}>
            {choice.odds.success}%
          </dd>
        </div>
        <div className="text-right">
          <dt className={typography.metadata}>Failure</dt>
          <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
            {choice.odds.failure}%
          </dd>
        </div>
        <div className="col-span-2">
          <dt className={typography.metadata}>Skill XP on success</dt>
          <dd className={`m-0 ${displayText} text-xl text-brass-bright`}>
            {choice.skillExperience
              ? `+${choice.skillExperience.success} XP · Critical +${choice.skillExperience.criticalSuccess} XP`
              : "Unavailable for this older job"}
          </dd>
        </div>
        {choice.checkBreakdown ? (
          <MissionCheckBreakdown
            breakdown={choice.checkBreakdown}
            gear={choice.gear}
          />
        ) : null}
      </dl>
      <p
        className={cx(
          `m-0 ${typography.metadata}`,
          !choice.gear
            ? "text-muted"
            : choice.gear.satisfied
              ? "text-profit"
              : "text-danger-strong",
        )}
      >
        Equipment: {equipmentStatus}
      </p>
      {choice.healthRisk ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`}>
          Health risk: failure can cause damage; accepted armor is already
          included in protection.
        </p>
      ) : null}
    </article>
  );
}
