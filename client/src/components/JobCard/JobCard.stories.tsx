import type { Meta, StoryObj } from "@storybook/nextjs";
import { docksOffer } from "../MissionRunner/MissionRunnerMocks";
import { JobCard } from "./JobCard";

const meta = {
  title: "Components/JobCard",
  component: JobCard,
  args: {
    offer: docksOffer,
    onAccept: () => {}
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof JobCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
