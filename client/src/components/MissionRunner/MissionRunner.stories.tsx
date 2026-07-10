import type { Meta, StoryObj } from "@storybook/nextjs";
import { MissionRunner } from "./MissionRunner";
import {
  equippedMission,
  generatingMission,
  midMission,
  resolvedMission,
  zeroSkillExperienceMission
} from "./MissionRunnerMocks";

const meta = {
  title: "Components/MissionRunner",
  component: MissionRunner,
  args: {
    isChoosing: false,
    onChoose: () => {},
    onFinish: () => {}
  }
} satisfies Meta<typeof MissionRunner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MidMission: Story = {
  args: {
    mission: midMission
  }
};

export const EquippedChoice: Story = {
  args: {
    mission: equippedMission
  }
};

export const Generating: Story = {
  args: {
    mission: generatingMission
  }
};

export const Resolved: Story = {
  args: {
    mission: resolvedMission
  }
};

export const ResolvedWithoutSkillExperience: Story = {
  args: {
    mission: zeroSkillExperienceMission
  }
};
