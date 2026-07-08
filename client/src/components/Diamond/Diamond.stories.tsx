import type { Meta, StoryObj } from "@storybook/nextjs";
import { Diamond } from "./Diamond";

const meta = {
  title: "Components/Diamond",
  component: Diamond,
  args: {
    className: "border-brass"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Diamond>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {};

export const Medium: Story = {
  args: {
    className: "border-line",
    size: "medium"
  }
};

export const Large: Story = {
  args: {
    size: "large"
  }
};
