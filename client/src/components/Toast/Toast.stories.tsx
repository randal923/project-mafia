import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "../Button/Button";
import { Toast } from "./Toast";

const meta = {
  title: "Components/Toast",
  component: Toast,
  args: {
    message: "The crew completed the pickup before the patrol changed shifts.",
    title: "Collection secured",
    tone: "success"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Failure: Story = {
  args: {
    message: "Two men were seen leaving the alley and the precinct has names.",
    title: "Job exposed",
    tone: "failure"
  }
};

export const Info: Story = {
  args: {
    message: "A new contact is available at the rail yard until dawn.",
    title: "Rumor surfaced",
    tone: "info"
  }
};

export const Warning: Story = {
  args: {
    action: <Button size="small" variant="secondary">Review heat</Button>,
    message: "The next risky order may push the district into lockdown.",
    title: "Heat rising",
    tone: "warning"
  }
};
