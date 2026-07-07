import type { Meta, StoryObj } from "@storybook/nextjs";
import { StatPanel } from "./StatPanel";

const meta = {
  title: "Components/StatPanel",
  component: StatPanel,
  args: {
    detail: "+12% from night work",
    label: "Cash",
    value: "$14,280"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof StatPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Profit: Story = {
  args: {
    tone: "profit"
  }
};

export const Danger: Story = {
  args: {
    detail: "Detectives watching the docks",
    label: "Heat",
    tone: "danger",
    value: "41"
  }
};

export const Neutral: Story = {
  args: {
    detail: "Two waiting for orders",
    label: "Crew",
    tone: "neutral",
    value: "7"
  }
};
