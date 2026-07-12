import type { MissionViewChoice } from "@shared/job";
import { SKILLS } from "@shared/skills";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";
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
  const t = useTranslations("mission.choice");
  const { itemName, skillName } = useCatalogText();
  const equipmentStatus = !choice.gear
    ? t("equipment.none")
    : choice.locked
      ? t("equipment.locked", { gear: choice.gear.label })
      : !choice.gear.satisfied
        ? t("equipment.missing", { gear: choice.gear.label })
        : choice.gear.consumes
          ? t("equipment.readyConsumable", {
              item: choice.gear.item ? itemName(choice.gear.item) : choice.gear.label,
            })
          : t("equipment.readyReusable", {
              item: choice.gear.item ? itemName(choice.gear.item) : choice.gear.label,
            });

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
          {choice.stakes === "safer" ? t("saferPlay") : t("bolderPlay")}
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
          ? t("lockedNeeds", {
              gear: choice.gear?.label ?? t("genericGear"),
            })
          : (choice.label ?? choice.approach)}
      </Button>
      <p className={`m-0 ${typography.narrativeCaption}`}>
        {choice.riskHint ??
          choice.intent ??
          t("testsSkill", { skill: skillName(choice.check.skill) })}
      </p>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-3">
        <div>
          <dt className={typography.metadata}>{t("skill")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-brass`}>
            {skillName(choice.check.skill)}
          </dd>
        </div>
        <div className="text-right">
          <dt className={typography.metadata}>{t("difficulty")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-ink`}>
            {choice.check.difficulty} / 100
          </dd>
        </div>
        <div>
          <dt className={typography.metadata}>{t("success")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-profit`}>
            {choice.odds.success}%
          </dd>
        </div>
        <div className="text-right">
          <dt className={typography.metadata}>{t("failure")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
            {choice.odds.failure}%
          </dd>
        </div>
        {choice.momentumPreview ? (
          <div>
            <dt className={typography.metadata}>{t("momentum")}</dt>
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
            <dt className={typography.metadata}>{t("priceOfMove")}</dt>
            <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
              {[
                choice.cashCost
                  ? t("cashUpFront", {
                      amount: moneyFormatter.format(choice.cashCost),
                    })
                  : null,
                choice.heatOnFail
                  ? t("heatOnMiss", { heat: choice.heatOnFail })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
        <div className="col-span-2">
          <dt className={typography.metadata}>{t("skillXpOnSuccess")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-brass-bright`}>
            {choice.skillExperience
              ? t("xpValues", {
                  critical: choice.skillExperience.criticalSuccess,
                  success: choice.skillExperience.success,
                })
              : t("xpUnavailable")}
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
        {t("equipmentLabel")} {equipmentStatus}
      </p>
      {choice.cashCost ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`}>
          {t("upfrontCost", {
            amount: moneyFormatter.format(choice.cashCost),
          })}
        </p>
      ) : null}
      {choice.healthRisk ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`}>
          {t("healthRisk")}
        </p>
      ) : null}
    </article>
  );
}
