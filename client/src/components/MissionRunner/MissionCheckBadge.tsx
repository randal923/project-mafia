import type { RevealedEdge } from "@shared/job";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type MissionCheckBadgeProps = {
  edge: RevealedEdge;
};

export function MissionCheckBadge({ edge }: MissionCheckBadgeProps) {
  const wide = Math.abs(edge.margin) >= 40;
  const text = edge.passed
    ? `${edge.check.skill} check passed${wide ? " — critical" : ""}`
    : `${edge.check.skill} check failed${wide ? " — badly" : ""}`;

  return (
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
  );
}
