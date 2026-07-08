import type { Meta, StoryObj } from "@storybook/nextjs";
import { TextInput } from "./TextInput";

const meta = {
  title: "Components/TextInput",
  component: TextInput,
  args: {
    id: "player-name",
    label: "Name",
    placeholder: "Rico Vale"
  },
  parameters: {
    layout: "centered"
  },
  render: (args) => (
    <div className="w-80">
      <TextInput {...args} />
    </div>
  )
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    defaultValue: "Rico",
    error: "That name is already taken."
  }
};

export const Disabled: Story = {
  args: {
    defaultValue: "Rico Vale",
    disabled: true
  }
};
