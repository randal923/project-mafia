type JobStatProps = {
  label: string;
  value: number | string;
};

export function JobStat({ label, value }: JobStatProps) {
  return (
    <div className="border border-line bg-obsidian/35 px-3 py-2">
      <dt className="text-xs uppercase tracking-widest text-ash">{label}</dt>
      <dd className="mt-1 font-semibold text-ivory">{value}</dd>
    </div>
  );
}
