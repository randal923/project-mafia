import type { SelectHTMLAttributes } from "react";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";

type DropdownOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type DropdownMenuProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  helperText?: string;
  label: string;
  options: readonly DropdownOption[];
  placeholder?: string;
};

export function DropdownMenu({
  className,
  helperText,
  label,
  options,
  placeholder,
  ...props
}: DropdownMenuProps) {
  const classNames = cx(
    `mafia-select w-full appearance-none rounded-control border border-line bg-black px-4 py-3 pr-10 ${displayText} text-xl text-ink shadow-command focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
    className
  );

  return (
    <label className="block">
      <span className={`mb-2 block ${typography.eyebrow}`}>{label}</span>
      <span className="relative block">
        <select className={classNames} {...props}>
          {placeholder ? (
            <option disabled hidden value="">
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute top-1/2 right-4 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-b border-brass"
          aria-hidden="true"
        />
      </span>
      {helperText ? (
        <span className={`mt-2 block ${typography.paragraph}`}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
