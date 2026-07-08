import { toneTextClasses } from "../../design-system/tones";
import { typography } from "../../design-system/typography";
import { Frame } from "../Frame/Frame";

type StatTone = "neutral" | "profit" | "danger";

type StatPanelProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
};

const toneTokens: Record<StatTone, "brass" | "danger" | "profit"> = {
  danger: "danger",
  neutral: "brass",
  profit: "profit"
};

export function StatPanel({
  detail,
  label,
  tone = "neutral",
  value
}: StatPanelProps) {
  const toneToken = toneTokens[tone];

  return (
    <Frame
      ariaLabel={label}
      className={`min-h-36 ${toneTextClasses[toneToken]}`}
      element="article"
      headerIcon="diamond"
      headerTitle={label}
      topBorderColor={toneToken}
      withHeader
    >
      <p className={`m-0 ${typography.statValue}`}>{value}</p>
      <p className={`mt-4 mb-0 ${typography.paragraph}`}>{detail}</p>
    </Frame>
  );
}
