import type { Meta, StoryObj } from "@storybook/nextjs";
import { OrnamentDivider } from "./OrnamentDivider";

const meta = {
  title: "Components/OrnamentDivider",
  component: OrnamentDivider,
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof OrnamentDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};
