import type { Meta, StoryObj } from "@storybook/nextjs";
import { Frame } from "./Frame";

const meta = {
  title: "Components/Frame",
  component: Frame,
  args: {
    children:
      "A clerk at city hall says the permit ledger is unattended for one hour. Taking it could expose the alderman, but the police have been leaning on the same office all week."
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Frame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const LongStory: Story = {
  args: {
    children:
      "The union boss sends word that the docks are quiet, too quiet. A missing manifest points to a shipment no one wants named, and every crew in the ward is waiting to see who moves first."
  }
};

export const WithHeader: Story = {
  args: {
    children:
      "Detectives are watching the docks, and the next risky order may pull patrols into the ward.",
    className: "text-brass",
    headerIcon: "diamond",
    headerTitle: "Heat",
    withHeader: true
  }
};
