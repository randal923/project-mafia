import type { Meta, StoryObj } from "@storybook/nextjs";
import { Table } from "./Table";

const crewColumns = [
  { header: "Crew", id: "crew", isRowHeader: true },
  { header: "Role", id: "role" },
  { align: "right", header: "Take", id: "take" },
  { align: "right", header: "Heat", id: "heat" }
] as const;

const crewRows = [
  {
    cells: [
      { detail: "Broker", value: "Mara Voss" },
      { value: "Back-room deals" },
      { tone: "profit", value: "$18k" },
      { tone: "danger", value: "High" }
    ],
    id: "mara-voss"
  },
  {
    cells: [
      { detail: "Driver", value: "Nico Graves" },
      { value: "Courier routes" },
      { tone: "profit", value: "$9k" },
      { tone: "muted", value: "Low" }
    ],
    id: "nico-graves"
  },
  {
    cells: [
      { detail: "Enforcer", value: "Elia Stone" },
      { value: "Dock pressure" },
      { tone: "profit", value: "$12k" },
      { tone: "danger", value: "Rising" }
    ],
    id: "elia-stone"
  }
] as const;

const meta = {
  title: "Components/Table",
  component: Table,
  args: {
    caption: "Crew ledger",
    columns: crewColumns,
    description: "Current assignments, revenue, and operational pressure.",
    rows: crewRows
  },
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ledger: Story = {};

export const Compact: Story = {
  args: {
    density: "compact"
  }
};

export const Empty: Story = {
  args: {
    emptyMessage: "No crews assigned to this district.",
    rows: []
  }
};
