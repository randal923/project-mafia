import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Run next turn"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    children: "Assign crew",
    variant: "secondary"
  }
};

export const QuietDisabled: Story = {
  args: {
    children: "Back",
    disabled: true,
    variant: "quiet"
  }
};
