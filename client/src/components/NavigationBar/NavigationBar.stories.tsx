import type { Meta, StoryObj } from "@storybook/nextjs";
import { NavigationBar } from "./NavigationBar";

const meta = {
  title: "Components/NavigationBar",
  component: NavigationBar,
  args: {
    activeItemId: "news",
    ariaLabel: "Primary navigation",
    brand: "Project Mafia",
    items: [
      { href: "#news", id: "news", label: "News" },
      { href: "#jobs", id: "jobs", label: "Jobs" },
      { href: "#night-life", id: "night-life", label: "Night Life" },
      { href: "#bank", id: "bank", label: "Bank" },
      { href: "#gym", id: "gym", label: "Gym" },
      { href: "#underworld", id: "underworld", label: "Underworld" },
      { href: "#docks", id: "docks", label: "Docks" },
      { href: "#stocks", id: "stocks", label: "Stocks" }
    ]
  },
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof NavigationBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-page px-6 text-ink">
        <Story />
      </div>
    )
  ]
};
