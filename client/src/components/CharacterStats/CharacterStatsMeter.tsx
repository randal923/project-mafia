import {
  toneBackgroundClasses,
  type BackgroundTone
} from "../../design-system/tones";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { HoverTip } from "../HoverTip/HoverTip";

type CharacterStatsMeterProps = {
  /** Tooltip explaining what the stat is; shown on label hover. */
  hint?: string;
  label: string;
  max: number;
  tone: BackgroundTone;
  value: number;
  valueLabel?: string;
};

export function CharacterStatsMeter({
  hint,
  label,
  max,
  tone,
  value,
  valueLabel
}: CharacterStatsMeterProps) {
  const safeMax = Math.max(1, max);
  const clampedValue = Math.min(safeMax, Math.max(0, value));
  const fillPercent = (clampedValue / safeMax) * 100;
  const labelText = (
    <p
      className={cx(
        `m-0 ${displayText} text-xl text-muted`,
        hint && "underline decoration-dotted decoration-faint underline-offset-4"
      )}
    >
      {label}
    </p>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        {hint ? <HoverTip tip={hint}>{labelText}</HoverTip> : labelText}
        <p className={`m-0 ${displayText} text-xl text-ink`}>
          {valueLabel ?? clampedValue}
        </p>
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={clampedValue}
        className="mt-2 h-2 overflow-hidden rounded-control border border-line bg-black/40"
        role="meter"
      >
        <div
          className={cx("h-full", toneBackgroundClasses[tone])}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
