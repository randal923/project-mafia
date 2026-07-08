import { cx } from "../../lib/cx";

type DiamondSize = "small" | "medium" | "large";

type DiamondProps = {
  className?: string;
  size?: DiamondSize;
};

const sizeClasses: Record<DiamondSize, string> = {
  large: "h-4 w-4 border-2",
  medium: "h-3 w-3 border",
  small: "h-2 w-2 border"
};

export function Diamond({ className, size = "small" }: DiamondProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block rotate-45", sizeClasses[size], className)}
    />
  );
}
