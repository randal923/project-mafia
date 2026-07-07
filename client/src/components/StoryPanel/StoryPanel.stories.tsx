import type { Meta, StoryObj } from "@storybook/nextjs";
import { StoryPanel } from "./StoryPanel";

const meta = {
  title: "Components/StoryPanel",
  component: StoryPanel,
  args: {
    story:
      "A clerk at city hall says the permit ledger is unattended for one hour. Taking it could expose the alderman, but the police have been leaning on the same office all week."
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof StoryPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const LongStory: Story = {
  args: {
    story:
      "The union boss sends word that the docks are quiet, too quiet. A missing manifest points to a shipment no one wants named, and every crew in the ward is waiting to see who moves first."
  }
};
