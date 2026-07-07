import type { ReactNode } from "react";

type FrameProps = {
  children: ReactNode;
  className?: string;
};

export function Frame({ children, className }: FrameProps) {
  const classNames = [
    "rounded-panel border border-line bg-black/25 p-5 md:p-6",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {children}
    </div>
  );
}
