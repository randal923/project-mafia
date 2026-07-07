type StatusPanelRowTone = "default" | "accent";

type StatusPanelRowProps = {
  label: string;
  tone?: StatusPanelRowTone;
  value: number | string;
};

export function StatusPanelRow({
  label,
  tone = "default",
  value,
}: StatusPanelRowProps) {
  const valueColorClass = tone === "accent" ? "text-sulfur" : "text-ivory";

  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-ash">{label}</p>
      <p
        className={`text-right text-lg uppercase tracking-[0.12em] ${valueColorClass}`}
      >
        {value}
      </p>
    </div>
  );
}
