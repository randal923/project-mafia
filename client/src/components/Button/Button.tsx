import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet";
type ButtonSize = "medium" | "small";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-brass bg-black/50 text-ink shadow-command enabled:hover:border-brass-bright enabled:hover:bg-brass/15",
  secondary:
    "border-line bg-transparent text-brass enabled:hover:border-brass enabled:hover:bg-brass/10 enabled:hover:text-brass-bright",
  quiet:
    "border-transparent bg-transparent text-muted enabled:hover:border-line enabled:hover:text-ink"
};

const sizeClasses: Record<ButtonSize, string> = {
  medium: "min-h-12 px-8 py-3 text-xl",
  small: "min-h-10 px-5 py-2 text-lg"
};

export function Button({
  className,
  size = "medium",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classNames = [
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border text-center font-display uppercase leading-none tracking-normal transition-[background-color,border-color,color] duration-150 ease-in-out focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classNames} type={type} {...props} />;
}
