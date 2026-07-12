import { displayText } from "../../design-system/typography";

type SectionHeaderProps = {
  aside?: string;
  eyebrow: string;
  title: string;
};

export function SectionHeader({ aside, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface-raised px-4 py-4">
      <div>
        <p className={`m-0 ${displayText} text-xl text-faint`}>{eyebrow}</p>
        <h2 className={`mt-2 mb-0 ${displayText} text-4xl text-title`}>
          {title}
        </h2>
      </div>
      {aside ? (
        <p className={`m-0 ${displayText} text-xl text-brass`}>{aside}</p>
      ) : null}
    </div>
  );
}
