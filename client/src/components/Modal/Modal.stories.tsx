import type { Meta, StoryObj } from "@storybook/nextjs";
import { Modal } from "./Modal";

const meta = {
  title: "Components/Modal",
  component: Modal,
  args: {
    intro:
      "A clerk at city hall says the permit ledger is unattended for one hour. Taking it could expose the alderman, but the police have been leaning on the same office all week.",
    open: true,
    options: [
      {
        description: "Send two quiet men and keep the alderman useful.",
        id: "steal-ledger",
        label: "Take the ledger",
        tone: "primary"
      },
      {
        description: "Leave the clerk in place and buy safer information later.",
        id: "walk-away",
        label: "Walk away",
        tone: "secondary"
      }
    ] as const,
    title: "City Hall ledger"
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const HighRisk: Story = {
  args: {
    eyebrow: "Heat rising",
    intro:
      "Your driver has been spotted outside the courthouse twice. The prosecutor's office may already have a name, but the witness will be moved before dawn.",
    options: [
      {
        description: "Intercept the transfer and risk a full city response.",
        id: "hit-transfer",
        label: "Stop the transfer",
        tone: "danger"
      },
      {
        description: "Burn the courthouse contact and protect the crew.",
        id: "cut-contact",
        label: "Cut the contact",
        tone: "secondary"
      }
    ] as const,
    title: "Witness on the move"
  }
};
