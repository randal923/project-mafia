import type { Meta, StoryObj } from "@storybook/nextjs";
import { InventoryItemCard } from "../Inventory/InventoryItemCard";
import { ItemHoverCard } from "./ItemHoverCard";

const stilettoKnife = {
  id: "stiletto-knife",
  image: {
    alt: "Stiletto knife",
    src: "/images/items/stiletto-knife.png"
  },
  name: "Stiletto Knife",
  power: 2,
  tone: "brass"
} as const;

const meta = {
  title: "Components/ItemHoverCard",
  component: ItemHoverCard,
  args: {
    // render ignores this and nests InventoryItemCard itself.
    children: null,
    item: stilettoKnife
  },
  parameters: {
    layout: "fullscreen"
  },
  render: (args) => (
    <div className="flex min-h-screen w-screen items-center justify-center bg-page p-6">
      <div className="w-40">
        <ItemHoverCard {...args}>
          <InventoryItemCard item={args.item} />
        </ItemHoverCard>
      </div>
    </div>
  )
} satisfies Meta<typeof ItemHoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  name: "With Image"
};

export const WithoutImage: Story = {
  args: {
    item: {
      id: "payoff-ledger",
      name: "Payoff Ledger",
      power: 1,
      tone: "profit"
    }
  },
  name: "Without Image"
};
