import { typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type TagProps = {
  className?: string;
  label: string;
};

export function Tag({ className, label }: TagProps) {
  const classNames = cx(
    `inline-flex w-fit items-center rounded-control border border-line px-3 py-1 ${typography.commandLabel}`,
    className
  );

  return <span className={classNames}>{label}</span>;
}
