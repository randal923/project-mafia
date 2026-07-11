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

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

export function MissionChoiceCard({
  choice,
  disabled,
  onChoose,
}: MissionChoiceCardProps) {
  const matchedItem = choice.gear?.item?.name ?? choice.gear?.label;
  const equipmentStatus = !choice.gear
    ? "No equipment required — odds shown as-is"
    : choice.locked
      ? `Locked: this move needs a ${choice.gear.label} and you don't have one`
      : !choice.gear.satisfied
        ? `Missing: ${choice.gear.label} — penalty included in odds`
        : choice.gear.consumes
          ? `Ready: ${matchedItem} — single-use; one is consumed if chosen, and readiness is included in the odds`
          : `Ready: ${matchedItem} — reusable; readiness is included in the odds`;

  return (
    <article
      className={cx(
        "flex flex-col gap-3 rounded-panel border border-line bg-black/30 p-4",
        choice.locked && "opacity-70"
      )}
    >
      {choice.stakes ? (
        <span
          className={cx(
            `inline-flex w-fit items-center rounded-control border px-2 py-0.5 ${displayText} text-sm`,
            choice.stakes === "safer"
              ? "border-teal text-teal"
              : "border-brass-bright text-brass-bright"
          )}
        >
          {choice.stakes === "safer" ? "Safer play" : "Bolder play"}
        </span>
      ) : null}
      <Button
        className="w-full"
        disabled={disabled || choice.locked}
        font="narrative"
        onClick={() => onChoose(choice.id)}
        size="small"
        variant="secondary"
      >
        {choice.locked
          ? `Locked — needs ${choice.gear?.label ?? "equipment"}`
          : (choice.label ?? choice.approach)}
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
        {choice.momentumPreview ? (
          <div>
            <dt className={typography.metadata}>Momentum</dt>
            <dd className={`m-0 ${displayText} text-xl text-ink`}>
              <span className="text-profit">
                +{choice.momentumPreview.pass}
              </span>
              {" / "}
              <span className="text-danger-strong">
                {choice.momentumPreview.fail}
              </span>
            </dd>
          </div>
        ) : null}
        {choice.cashCost || choice.heatOnFail ? (
          <div className="text-right">
            <dt className={typography.metadata}>Price of the move</dt>
            <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
              {[
                choice.cashCost
                  ? `−${moneyFormatter.format(choice.cashCost)} up front`
                  : null,
                choice.heatOnFail ? `+${choice.heatOnFail} heat on a miss` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
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
      {choice.cashCost ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`}>
          Upfront cost: {moneyFormatter.format(choice.cashCost)} is paid the
          moment you commit — win or lose.
        </p>
      ) : null}
      {choice.healthRisk ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`}>
          Health risk: failure can cause damage; accepted armor is already
          included in protection.
        </p>
      ) : null}
    </article>
  );
}
