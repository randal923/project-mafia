import { typography } from "../../design-system/typography";

type CharacterStatsListProps = {
  emptyLabel: string;
  items: readonly string[];
};

export function CharacterStatsList({
  emptyLabel,
  items
}: CharacterStatsListProps) {
  if (items.length === 0) {
    return <p className={`m-0 ${typography.paragraph}`}>{emptyLabel}</p>;
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          className={`border-l-2 border-line pl-3 ${typography.paragraph}`}
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
