import type { Meta, StoryObj } from "@storybook/nextjs";
import { Inventory } from "./Inventory";

const stilettoKnife = {
  detail: "Concealable steel for quiet work.",
  id: "stiletto-knife",
  image: {
    alt: "Stiletto knife",
    src: "/images/items/stiletto-knife.png"
  },
  name: "Stiletto Knife",
  power: 2,
  tone: "brass"
} as const;

const equippedSlots = [
  { id: "head", label: "Head" },
  {
    id: "torso",
    item: {
      detail: "A discreet layer under the suit jacket.",
      id: "armored-vest",
      name: "Armored Vest",
      tone: "teal"
    },
    label: "Torso"
  },
  {
    id: "hand",
    item: stilettoKnife,
    label: "Hand"
  },
  { id: "waist", label: "Waist" },
  {
    id: "feet",
    item: {
      detail: "Keeps a meeting clean and exits quiet.",
      id: "polished-shoes",
      name: "Polished Shoes"
    },
    label: "Feet"
  }
] as const;

const stashItems = [
  {
    detail: "Names three patrol officers taking envelope money.",
    id: "payoff-ledger",
    name: "Payoff Ledger",
    tone: "profit"
  },
  {
    detail: "Opens cheap locks without raising the street alarm.",
    id: "lockpick-roll",
    name: "Lockpick Roll",
    quantity: 2,
    tone: "teal"
  },
  {
    detail: "Useful once, then every badge in the ward listens harder.",
    id: "police-radio",
    name: "Police Radio",
    tone: "danger"
  }
] as const;

const emptySlots = [
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "hand", label: "Hand" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" }
] as const;

const meta = {
  title: "Components/Inventory",
  component: Inventory,
  args: {
    slots: equippedSlots,
    stashItems
  },
  parameters: {
    layout: "fullscreen"
  },
  render: (args) => (
    <div className="flex min-h-screen w-screen items-center justify-center bg-page p-6">
      <Inventory {...args} />
    </div>
  )
} satisfies Meta<typeof Inventory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyLoadout: Story = {
  args: {
    slots: emptySlots,
    stashItems: [],
    showStash: false
  },
  name: "Empty Loadout"
};

export const FullLoadout: Story = {
  args: {
    showStash: false
  },
  name: "Full Loadout"
};

export const EmptyStash: Story = {
  args: {
    showLoadout: false,
    stashCapacity: 8,
    stashItems: []
  },
  name: "Empty Stash"
};

export const FullStash: Story = {
  args: {
    showLoadout: false,
    stashCapacity: 5,
    stashItems: [
      ...stashItems,
      stilettoKnife,
      {
        detail: "Marked bills from a dockside collection.",
        id: "marked-cash",
        name: "Marked Cash",
        tone: "profit"
      }
    ]
  }
};
