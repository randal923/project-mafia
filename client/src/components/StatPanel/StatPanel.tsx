import { Frame } from "../Frame/Frame";

type StatTone = "neutral" | "profit" | "danger";

type StatPanelProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  danger: "text-danger-strong",
  neutral: "text-brass",
  profit: "text-profit",
};

const toneBorderColors: Record<StatTone, "brass" | "danger" | "profit"> = {
  danger: "danger",
  neutral: "brass",
  profit: "profit",
};

export function StatPanel({
  detail,
  label,
  tone = "neutral",
  value,
}: StatPanelProps) {
  return (
    <Frame
      ariaLabel={label}
      className={`min-h-36 ${toneClasses[tone]}`}
      element="article"
      headerIcon="diamond"
      headerTitle={label}
      topBorderColor={toneBorderColors[tone]}
      withHeader
    >
      <p className="m-0 font-display text-5xl uppercase leading-none tracking-normal text-ink">
        {value}
      </p>
      <p className="mt-4 mb-0 text-base leading-relaxed text-muted">{detail}</p>
    </Frame>
  );
}
