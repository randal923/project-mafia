import type { CheckModifierBreakdown, EdgeGear } from "@shared/job";
import { displayText, typography } from "../../design-system/typography";

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
  return (
    <div className="col-span-2 border-t border-line pt-3">
      <p className={`m-0 ${typography.metadata}`}>Authoritative check math</p>
      <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt>Base chance</dt>
        <dd className="m-0 text-right">{breakdown.baseChance}%</dd>
        <dt>Skill ({breakdown.skillLevel})</dt>
        <dd className="m-0 text-right">+{breakdown.skillChance}%</dd>
        {breakdown.equipmentSkillBonus !== 0 ? (
          <>
            <dt>Equipped skill effect</dt>
            <dd className="m-0 text-right">
              +{breakdown.equipmentSkillBonus}%
            </dd>
          </>
        ) : null}
        <dt>Character power ({breakdown.characterPower})</dt>
        <dd className="m-0 text-right">
          +{breakdown.characterPowerBonus}%
        </dd>
        <dt>Equipment power ({breakdown.equipmentPower})</dt>
        <dd className="m-0 text-right">
          +{breakdown.equipmentPowerBonus}%
        </dd>
        {gear?.satisfied && gear.consumes && gear.item ? (
          <>
            <dt>
              On use: {gear.item.name} (Power {breakdown.consumablePower})
            </dt>
            <dd className="m-0 text-right">
              +{breakdown.consumablePowerBonus}%
            </dd>
          </>
        ) : null}
        {breakdown.approachBonus !== 0 ? (
          <>
            <dt>Approach effect</dt>
            <dd className="m-0 text-right">+{breakdown.approachBonus}%</dd>
          </>
        ) : null}
        <dt>Difficulty</dt>
        <dd className="m-0 text-right">{breakdown.difficultyModifier}%</dd>
        <dt>Heat</dt>
        <dd className="m-0 text-right">−{breakdown.heatPenalty}%</dd>
        <dt>Intoxication</dt>
        <dd className="m-0 text-right">
          −{breakdown.intoxicationPenalty}%
        </dd>
        {breakdown.finalAdjustment !== 0 ? (
          <>
            <dt>Rounding / limits</dt>
            <dd className="m-0 text-right">
              {formatAdjustment(breakdown.finalAdjustment)}
            </dd>
          </>
        ) : null}
      </dl>
      <p className={`m-0 mt-2 ${displayText} text-lg text-profit`}>
        Final chance {breakdown.finalChance}%
      </p>
    </div>
  );
}
