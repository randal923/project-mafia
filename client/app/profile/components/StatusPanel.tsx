import { profileStatus } from "../lib/profileData";
import { Card } from "./Card";
import { StatusPanelRow } from "./StatusPanelRow";

type StatusPanelProps = {
  power: number;
};

export function StatusPanel({ power }: StatusPanelProps) {
  const rows = [
    {
      id: "name",
      label: "Name",
      tone: "default",
      value: profileStatus.name,
    },
    {
      id: "cash-on-hand",
      label: "Cash on Hand",
      tone: "default",
      value: profileStatus.cashOnHand,
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
