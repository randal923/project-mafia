import type { RevealedEdge } from "@shared/job";
import { useTranslations } from "next-intl";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";
import { useFormatters } from "../../lib/useFormatters";

type MissionCheckBadgeProps = {
  edge: RevealedEdge;
};

export function MissionCheckBadge({ edge }: MissionCheckBadgeProps) {
  const t = useTranslations("mission.checkBadge");
  const { moneyFormatter } = useFormatters();
  const { itemName, skillName } = useCatalogText();
  const wide = Math.abs(edge.margin) >= 40;
  const floorProtection = edge.damage
    ? Math.max(
        0,
        edge.damage.incoming -
          edge.damage.absorbed -
          edge.damage.healthLost,
      )
    : 0;
  const skill = skillName(edge.check.skill);
  const text = edge.passed
    ? wide
      ? t("passedCritical", { skill })
      : t("passed", { skill })
    : wide
      ? t("failedBadly", { skill })
      : t("failed", { skill });
  const momentumDeltaText =
    typeof edge.momentumDelta === "number" && edge.momentumDelta >= 0
      ? `+${edge.momentumDelta}`
      : `${edge.momentumDelta}`;

  return (
    <div className="flex flex-col items-start gap-2">
      <span
        className={cx(
          `inline-flex w-fit items-center rounded-control border px-3 py-1 ${displayText} text-lg`,
          edge.passed
            ? "border-profit text-profit"
            : "border-danger-strong text-danger-strong"
        )}
      >
        {text}
      </span>
      {edge.damage ? (
        <span className="text-sm font-medium text-danger-strong">
          {t("damageSummary", {
            absorbed: edge.damage.absorbed,
            incoming: edge.damage.incoming,
            lost: edge.damage.healthLost,
          })}
          {floorProtection > 0
            ? ` · ${t("floorStopped", { amount: floorProtection })}`
            : ""}
        </span>
      ) : null}
      {edge.gear?.item ? (
        <span className="text-sm font-medium text-brass">
          {edge.gear.consumes
            ? t("gearConsumed", { item: itemName(edge.gear.item) })
            : t("gearCovered", { item: itemName(edge.gear.item) })}
        </span>
      ) : null}
      {typeof edge.momentumDelta === "number" ? (
        <span
          className={cx(
            "text-sm font-medium",
            edge.momentumDelta >= 0 ? "text-profit" : "text-danger-strong"
          )}
        >
          {edge.stakes
            ? edge.stakes === "bolder"
              ? t("momentumBold", { delta: momentumDeltaText })
              : t("momentumSafe", { delta: momentumDeltaText })
            : t("momentum", { delta: momentumDeltaText })}
        </span>
      ) : null}
      {edge.cashSpent ? (
        <span className="text-sm font-medium text-danger-strong">
          {t("paidUpFront", {
            amount: moneyFormatter.format(edge.cashSpent),
          })}
        </span>
      ) : null}
      {edge.heatGained ? (
        <span className="text-sm font-medium text-danger-strong">
          {t("heatGained", { heat: edge.heatGained })}
        </span>
      ) : null}
    </div>
  );
}
