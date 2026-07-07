import type { ProfileStatus } from "../lib/profileTypes";
import { Card } from "./Card";
import { StatusPanelRow } from "./StatusPanelRow";

type StatusPanelProps = {
  power: number;
  status: ProfileStatus;
};

export function StatusPanel({ power, status }: StatusPanelProps) {
  const rows = [
    {
      id: "name",
      label: "Name",
      tone: "default",
      value: status.name,
    },
    {
      id: "clean-money",
      label: "Clean Money",
      tone: "default",
      value: `$${status.resources.cleanMoney}`,
    },
    {
      id: "dirty-money",
      label: "Dirty Money",
      tone: "default",
      value: `$${status.resources.dirtyMoney}`,
    },
    {
      id: "power",
      label: "Power",
      tone: "accent",
      value: power,
    },
  ] as const;

  return (
    <Card
      as="aside"
      className="h-full min-h-0"
      eyebrow="Status"
      title="Character"
    >
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <StatusPanelRow
            key={row.id}
            label={row.label}
            tone={row.tone}
            value={row.value}
          />
        ))}
      </div>
    </Card>
  );
}
