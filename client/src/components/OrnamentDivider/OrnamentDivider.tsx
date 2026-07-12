import { cx } from "../../lib/cx";
import { Diamond } from "../Diamond/Diamond";

type OrnamentDividerProps = {
  className?: string;
};

export function OrnamentDivider({ className }: OrnamentDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("flex items-center gap-3", className)}
    >
      <span className="h-px flex-1 bg-line" />
      <Diamond className="border-line" size="medium" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
