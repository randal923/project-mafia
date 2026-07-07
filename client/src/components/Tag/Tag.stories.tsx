import type { Meta, StoryObj } from "@storybook/nextjs";
import { Tag } from "./Tag";

const meta = {
  title: "Components/Tag",
  component: Tag,
  args: {
    label: "South Pier"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const LongName: Story = {
  args: {
    label: "Warehouse Row"
  }
};
