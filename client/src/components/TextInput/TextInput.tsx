import type { InputHTMLAttributes } from "react";
import { typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  id: string;
  label: string;
};

export function TextInput({
  className,
  error,
  id,
  label,
  ...props
}: TextInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label className={typography.eyebrow} htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={cx(
          "min-h-12 rounded-control border bg-black/30 px-4 py-2 text-lg text-ink placeholder:text-faint focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-brass-bright",
          error ? "border-danger-strong" : "border-line focus:border-brass"
        )}
        id={id}
        {...props}
      />
      {error ? (
        <p className={`m-0 ${typography.metadata} text-danger-strong`} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
