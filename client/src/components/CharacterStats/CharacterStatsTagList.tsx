import { typography } from "../../design-system/typography";
import { Tag } from "../Tag/Tag";

type CharacterStatsTagListProps = {
  emptyLabel: string;
  labels: readonly string[];
};

export function CharacterStatsTagList({
  emptyLabel,
  labels
}: CharacterStatsTagListProps) {
  if (labels.length === 0) {
    return <p className={`m-0 ${typography.paragraph}`}>{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <Tag key={label} label={label} />
      ))}
    </div>
  );
}
