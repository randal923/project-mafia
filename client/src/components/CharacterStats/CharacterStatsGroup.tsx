import type { ReactNode } from "react";
import { displayText } from "../../design-system/typography";

type CharacterStatsGroupProps = {
  children: ReactNode;
  label: string;
};

export function CharacterStatsGroup({
  children,
  label
}: CharacterStatsGroupProps) {
  return (
    <section aria-label={label}>
      <p className={`m-0 ${displayText} text-xl text-faint`}>{label}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
