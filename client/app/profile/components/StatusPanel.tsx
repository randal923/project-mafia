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
      id: "cash-on-hand",
      label: "Cash on Hand",
      tone: "default",
      value: status.cashOnHand,
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
