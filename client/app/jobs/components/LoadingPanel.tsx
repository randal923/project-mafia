type LoadingPanelProps = {
  label: string;
};

export function LoadingPanel({ label }: LoadingPanelProps) {
  return (
    <section className="flex min-h-96 items-center justify-center">
      <p className="text-sm uppercase tracking-widest text-ash">{label}</p>
    </section>
  );
}
