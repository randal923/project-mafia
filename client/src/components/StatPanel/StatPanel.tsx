type StatTone = "neutral" | "profit" | "danger";

type StatPanelProps = {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  danger: "border-t-danger-strong text-danger-strong",
  neutral: "border-t-brass text-brass",
  profit: "border-t-profit text-profit"
};

export function StatPanel({
  detail,
  label,
  tone = "neutral",
  value
}: StatPanelProps) {
  return (
    <article
      className={`min-h-36 rounded-panel border border-t-2 border-line bg-surface p-4 ${toneClasses[tone]}`}
      aria-label={label}
    >
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-line pb-3">
        <p className="m-0 font-display text-2xl uppercase leading-none tracking-normal text-current">
          {label}
        </p>
        <span
          className="h-2 w-2 rotate-45 border border-current"
          aria-hidden="true"
        />
      </div>
      <p className="m-0 font-display text-5xl uppercase leading-none tracking-normal text-ink">
        {value}
      </p>
      <p className="mt-4 mb-0 text-base leading-relaxed text-muted">
        {detail}
      </p>
    </article>
  );
}
