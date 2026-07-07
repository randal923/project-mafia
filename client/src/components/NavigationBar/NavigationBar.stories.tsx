import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "../Button/Button";
import { NavigationBar } from "./NavigationBar";

const meta = {
  title: "Components/NavigationBar",
  component: NavigationBar,
  args: {
    activeItemId: "operations",
    brand: "Project Mafia",
    items: [
      { href: "#operations", id: "operations", label: "Operations" },
      { badge: "3", href: "#crew", id: "crew", label: "Crew" },
      { href: "#city", id: "city", label: "City" },
      { href: "#ledger", id: "ledger", label: "Ledger" }
    ]
  },
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof NavigationBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    actions: <Button size="small">Next turn</Button>
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-page px-6 text-ink">
        <Story />
      </div>
    )
  ]
};

export const WithoutActions: Story = {};
