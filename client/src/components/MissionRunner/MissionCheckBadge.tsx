import type { RevealedEdge } from "@shared/job";
import { SKILLS } from "@shared/skills";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type MissionCheckBadgeProps = {
  edge: RevealedEdge;
};

export function MissionCheckBadge({ edge }: MissionCheckBadgeProps) {
  const wide = Math.abs(edge.margin) >= 40;
  const floorProtection = edge.damage
    ? Math.max(
        0,
        edge.damage.incoming -
          edge.damage.absorbed -
          edge.damage.healthLost,
      )
    : 0;
  const text = edge.passed
    ? `${SKILLS[edge.check.skill].label} check passed${wide ? " — critical" : ""}`
    : `${SKILLS[edge.check.skill].label} check failed${wide ? " — badly" : ""}`;

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
          Incoming {edge.damage.incoming} · Armor absorbed {edge.damage.absorbed}
          {" · "}Health lost {edge.damage.healthLost}
          {floorProtection > 0
            ? ` · 1-Health floor stopped ${floorProtection}`
            : ""}
        </span>
      ) : null}
      {edge.gear?.item ? (
        <span className="text-sm font-medium text-brass">
          {edge.gear.item.name}
          {edge.gear.consumes ? " was consumed" : " covered the move"}
        </span>
      ) : null}
    </div>
  );
}
