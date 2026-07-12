import type { Meta, StoryObj } from "@storybook/nextjs";
import { MissionRunner } from "./MissionRunner";
import {
  equippedMission,
  generatingMission,
  injuredMission,
  midMission,
  resolvedMission,
  resolvedAfterDamageMission,
  zeroSkillExperienceMission
} from "./MissionRunnerMocks";

const meta = {
  title: "Components/MissionRunner",
  component: MissionRunner,
  args: {
    healingError: null,
    healingItemId: null,
    healingItems: [
      {
        consumable: true,
        id: "first-aid-tin",
        name: "First-Aid Tin",
        quantity: 2,
        use: { health: 25 }
      }
    ],
    health: 68,
    healthUpdatedAt: new Date().toISOString(),
    isChoosing: false,
    onChoose: () => {},
    onFinish: () => {},
    onHeal: () => {}
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

export const InjuredWithHealingKit: Story = {
  args: {
    health: 63,
    mission: injuredMission
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

export const ResolvedAfterDamage: Story = {
  args: {
    health: 1,
    mission: resolvedAfterDamageMission,
  },
};

export const ResolvedWithoutSkillExperience: Story = {
  args: {
    mission: zeroSkillExperienceMission
  }
};
