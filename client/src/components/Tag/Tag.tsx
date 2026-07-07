type TagProps = {
  className?: string;
  label: string;
};

export function Tag({ className, label }: TagProps) {
  const classNames = [
    "inline-flex w-fit items-center rounded-control border border-line px-3 py-1 font-display text-xl uppercase leading-none tracking-normal text-ink",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames}>{label}</span>;
}
