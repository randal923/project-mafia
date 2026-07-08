import type { Meta, StoryObj } from "@storybook/nextjs";
import { CharacterStats } from "./CharacterStats";
import { ricoVale, soniaMarchetti } from "./CharacterStatsMocks";

const meta = {
  title: "Components/CharacterStats",
  component: CharacterStats,
  args: {
    profile: ricoVale
  },
  parameters: {
    layout: "fullscreen"
  },
  render: (args) => (
    <div className="flex min-h-screen w-screen justify-center bg-page p-6">
      <div className="w-full max-w-3xl">
        <CharacterStats {...args} />
      </div>
    </div>
  )
} satisfies Meta<typeof CharacterStats>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FreshStart: Story = {
  name: "Fresh Start"
};

export const EstablishedCapo: Story = {
  args: {
    profile: soniaMarchetti
  },
  name: "Established Capo"
};

export const ReputationTab: Story = {
  args: {
    initialTabId: "reputation",
    profile: soniaMarchetti
  },
  name: "Reputation Tab"
};

export const CrewTab: Story = {
  args: {
    initialTabId: "crew",
    profile: soniaMarchetti
  },
  name: "Crew Tab"
};

export const TerritoryTab: Story = {
  args: {
    initialTabId: "territory",
    profile: soniaMarchetti
  },
  name: "Territory Tab"
};

export const StoryTab: Story = {
  args: {
    initialTabId: "story",
    profile: soniaMarchetti
  },
  name: "Story Tab"
};
