import {
  toneBackgroundClasses,
  type BackgroundTone
} from "../../design-system/tones";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type CharacterStatsMeterProps = {
  label: string;
  max: number;
  tone: BackgroundTone;
  value: number;
  valueLabel?: string;
};

export function CharacterStatsMeter({
  label,
  max,
  tone,
  value,
  valueLabel
}: CharacterStatsMeterProps) {
  const safeMax = Math.max(1, max);
  const clampedValue = Math.min(safeMax, Math.max(0, value));
  const fillPercent = (clampedValue / safeMax) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className={`m-0 ${displayText} text-xl text-muted`}>{label}</p>
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
