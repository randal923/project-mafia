type ErrorPanelProps = {
  message: string;
};

export function ErrorPanel({ message }: ErrorPanelProps) {
  return (
    <section className="flex min-h-96 items-center justify-center">
      <p className="border border-blood bg-blood/20 px-4 py-3 text-sm text-ivory">
        {message}
      </p>
    </section>
  );
}
