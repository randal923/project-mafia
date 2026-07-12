import { JobApproach, OutcomeTier } from "../../../../shared/job";

export const APPROACH_TEXT: Record<JobApproach, { intent: string; label: string }> = {
  charm: {
    intent: "Make them like you enough to stop asking questions.",
    label: "Turn on the charm",
  },
  deception: {
    intent: "Grease the right palm and walk in like you belong.",
    label: "Run a con",
  },
  force: {
    intent: "Stop being subtle and let muscle settle it.",
    label: "Go in hard",
  },
  opportunistic: {
    intent: "Read the situation and strike when a gap opens.",
    label: "Wait for an opening",
  },
  quiet: {
    intent: "Stay in the shadows and leave no trace.",
    label: "Slip in without a sound",
  },
  social: {
    intent: "Work the people instead of the locks.",
    label: "Talk your way through",
  },
  technical: {
    intent: "Beat the locks, wires, and alarms instead of the people.",
    label: "Work the hardware",
  },
};

export const OUTCOME_TEXT: Record<OutcomeTier, { body: string; title: string }> = {
  jackpot: {
    body: "Everything broke your way — and then some. You walk off the Docks with more than the job was ever supposed to pay.",
    title: "Jackpot",
  },
  successful: {
    body: "Clean work. You got in, got the take, and got out before anyone knew to look for you.",
    title: "A clean job",
  },
  partially_successful: {
    body: "You got most of what you came for, but it wasn't pretty, and you left more behind than you'd like.",
    title: "Good enough",
  },
  partial_failure: {
    body: "The job fell apart halfway through. You salvaged scraps and slipped out with the sirens getting closer.",
    title: "Barely out",
  },
  failure: {
    body: "It went wrong, then it went worse. You wake up in a hospital bed with empty pockets and a city that noticed.",
    title: "It all went wrong",
  },
  disaster: {
    body: "They were waiting for you. A night in holding, a long interrogation, and every cop on the waterfront knows your face now.",
    title: "Busted",
  },
};
