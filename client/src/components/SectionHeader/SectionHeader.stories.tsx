import type { Meta, StoryObj } from "@storybook/nextjs";
import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "Components/SectionHeader",
  component: SectionHeader,
  args: {
    aside: "Gear slots",
    eyebrow: "Profile",
    title: "Loadout"
  },
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const WithoutAside: Story = {
  args: {
    aside: undefined,
    eyebrow: "Inventory",
    title: "Stash"
  }
};
