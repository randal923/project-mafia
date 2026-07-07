import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "../Button/Button";
import { NarrativeCard } from "./NarrativeCard";

const meta = {
  title: "Components/NarrativeCard",
  component: NarrativeCard,
  args: {
    children:
      "A foreman says fresh money is moving through Pier 9. The rumor is either a trap, a door, or both.",
    district: "South Pier",
    kicker: "Letter received",
    timeLabel: "Generated 3 min ago",
    title: "The harbor unions are nervous"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof NarrativeCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const UrgentWithAction: Story = {
  args: {
    action: <Button variant="secondary">Assign crew</Button>,
    priority: "urgent"
  }
};
