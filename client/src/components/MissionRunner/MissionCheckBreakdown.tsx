import type { CheckModifierBreakdown, EdgeGear } from "@shared/job";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { useCatalogText } from "../../lib/useCatalogText";

type MissionCheckBreakdownProps = {
  breakdown: CheckModifierBreakdown;
  gear: EdgeGear | null;
};

function formatAdjustment(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export function MissionCheckBreakdown({
  breakdown,
  gear,
}: MissionCheckBreakdownProps) {
  const t = useTranslations("mission.checkBreakdown");
  const { itemName } = useCatalogText();
  const combinedPower = breakdown.characterPower + breakdown.equipmentPower;
  const powerUntilNextBonus = breakdown.powerDivisor
    ? breakdown.powerDivisor - (combinedPower % breakdown.powerDivisor)
    : null;

  return (
    <div className="col-span-2 border-t border-line pt-3">
      <p className={`m-0 ${typography.metadata}`}>{t("title")}</p>
      <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt>{t("baseChance")}</dt>
        <dd className="m-0 text-right">{breakdown.baseChance}%</dd>
        <dt>{t("skillLevel", { level: breakdown.skillLevel })}</dt>
        <dd className="m-0 text-right">+{breakdown.skillChance}%</dd>
        {breakdown.equipmentSkillBonus !== 0 ? (
          <>
            <dt>{t("equippedSkillEffect")}</dt>
            <dd className="m-0 text-right">
              +{breakdown.equipmentSkillBonus}%
            </dd>
          </>
        ) : null}
        <dt>{t("characterPower", { power: breakdown.characterPower })}</dt>
        <dd className="m-0 text-right">
          +{breakdown.characterPowerBonus}%
        </dd>
        <dt>{t("equipmentPower", { power: breakdown.equipmentPower })}</dt>
        <dd className="m-0 text-right">
          +{breakdown.equipmentPowerBonus}%
        </dd>
        {powerUntilNextBonus !== null ? (
          <>
            <dt>{t("basePowerProgress")}</dt>
            <dd className="m-0 text-right">
              {t("powerProgressValue", {
                combined: combinedPower,
                remaining: powerUntilNextBonus,
              })}
            </dd>
          </>
        ) : null}
        {gear?.satisfied &&
        gear.consumes &&
        gear.item &&
        breakdown.consumablePower > 0 ? (
          <>
            <dt>
              {t("onUse", {
                item: itemName(gear.item),
                power: breakdown.consumablePower,
              })}
            </dt>
            <dd className="m-0 text-right">
              +{breakdown.consumablePowerBonus}%
            </dd>
          </>
        ) : null}
        {breakdown.approachBonus !== 0 ? (
          <>
            <dt>{t("approachEffect")}</dt>
            <dd className="m-0 text-right">+{breakdown.approachBonus}%</dd>
          </>
        ) : null}
        <dt>{t("difficulty")}</dt>
        <dd className="m-0 text-right">{breakdown.difficultyModifier}%</dd>
        <dt>{t("heat")}</dt>
        <dd className="m-0 text-right">−{breakdown.heatPenalty}%</dd>
        <dt>{t("intoxication")}</dt>
        <dd className="m-0 text-right">
          −{breakdown.intoxicationPenalty}%
        </dd>
        {breakdown.finalAdjustment !== 0 ? (
          <>
            <dt>{t("roundingLimits")}</dt>
            <dd className="m-0 text-right">
              {formatAdjustment(breakdown.finalAdjustment)}
            </dd>
          </>
        ) : null}
      </dl>
      <p className={`m-0 mt-2 ${displayText} text-lg text-profit`}>
        {t("finalChance", { chance: breakdown.finalChance })}
      </p>
    </div>
  );
}
