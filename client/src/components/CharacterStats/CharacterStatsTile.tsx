import { toneTextClasses, type TextTone } from "../../design-system/tones";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type CharacterStatsTileSize = "large" | "medium";

type CharacterStatsTileProps = {
  label: string;
  size?: CharacterStatsTileSize;
  tone?: TextTone;
  value: string;
};

const sizeClasses: Record<CharacterStatsTileSize, string> = {
  large: "text-3xl",
  medium: "text-2xl"
};

export function CharacterStatsTile({
  label,
  size = "large",
  tone = "ink",
  value
}: CharacterStatsTileProps) {
  const valueClassNames = cx(
    `mt-2 mb-0 ${displayText}`,
    sizeClasses[size],
    toneTextClasses[tone]
  );

  return (
    <div className="rounded-panel border border-line bg-surface-raised p-4">
      <p className={`m-0 ${displayText} text-lg text-muted`}>{label}</p>
      <p className={valueClassNames}>{value}</p>
    </div>
  );
}
