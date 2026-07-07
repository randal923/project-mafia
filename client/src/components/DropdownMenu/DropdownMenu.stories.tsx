import type { Meta, StoryObj } from "@storybook/nextjs";
import { DropdownMenu } from "./DropdownMenu";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  args: {
    defaultValue: "docks",
    helperText: "Choose where the crew spends the next turn.",
    label: "District",
    options: [
      { label: "South Pier", value: "docks" },
      { label: "Little Italy", value: "little-italy" },
      { label: "Works Quarter", value: "works-quarter" },
      { disabled: true, label: "Courthouse", value: "courthouse" }
    ]
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const WithPlaceholder: Story = {
  args: {
    defaultValue: "",
    label: "Next order",
    placeholder: "Select an order",
    options: [
      { label: "Collect from the union office", value: "collect-union" },
      { label: "Move cash through the florist", value: "move-cash" },
      { label: "Watch the rail yard", value: "watch-yard" }
    ]
  }
};
