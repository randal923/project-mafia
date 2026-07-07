"use client";

import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...buttonProps
}: ButtonProps) {
  const variantClassName =
    variant === "primary"
      ? "border-sulfur bg-sulfur text-obsidian hover:bg-ivory"
      : variant === "secondary"
        ? "border-line text-ivory hover:border-line-strong hover:text-sulfur"
        : "border-transparent px-0 text-sulfur hover:text-ivory";

  return (
    <button
      {...buttonProps}
      className={`border px-5 py-3 text-sm font-semibold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClassName} ${fullWidth ? "w-full" : ""} ${className}`}
      type={type}
    >
      {children}
    </button>
  );
}
