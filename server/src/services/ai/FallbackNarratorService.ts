import {
  ChoiceEdge,
  JobApproach,
  OutcomeTier,
} from "../../../../shared/job";
import {
  BeatChoiceText,
  BeatNarrationResult,
  MissionNarrator,
  NarrationInput,
  OutcomeNarrationInput,
  OutcomeNarrationResult,
} from "./MissionNarrator";

const APPROACH_TEXT: Record<JobApproach, { intent: string; label: string }> = {
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
};

const OUTCOME_TEXT: Record<OutcomeTier, { body: string; title: string }> = {
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

/**
 * Canned narration built purely from engine facts. Used when the LLM is
 * disabled or fails validation twice — the mission always stays playable.
 */
export class FallbackNarratorService implements MissionNarrator {
  narrateBeat(input: NarrationInput): Promise<BeatNarrationResult> {
    const { edgeTaken, mission, node } = input;
    const isIntro = edgeTaken === null;
    const location = mission.offer.storySeed.location;

    const body = isIntro
      ? `${mission.offer.storySeed.premise} ${mission.offer.storySeed.pressure}`
      : edgeTaken.roll.passed
        ? `It worked. Your ${edgeTaken.check.skill} held up, and the way forward is still open.`
        : `It went sideways. Your ${edgeTaken.check.skill} wasn't enough, and now the job is on a knife's edge.`;

    return Promise.resolve({
      choices: (node.choices ?? []).map((edge) => this.choiceText(edge)),
      narrative: {
        body,
        stakes: mission.offer.storySeed.pressure,
        storySummary: null,
        title: isIntro ? `The ${location} job` : "The job continues",
      },
      status: "fallback",
    });
  }

  narrateOutcome(input: OutcomeNarrationInput): Promise<OutcomeNarrationResult> {
    const { mission, node, rewards } = input;
    const outcome = OUTCOME_TEXT[node.outcomeTier ?? "partial_failure"];
    const take =
      rewards.cashChange > 0
        ? ` The take comes to $${rewards.cashChange}.`
        : "";

    return Promise.resolve({
      narrative: {
        body: `${outcome.body}${take}`,
        stakes: null,
        storySummary: `${outcome.title} at the ${mission.offer.storySeed.location}.`,
        title: outcome.title,
      },
      status: "fallback",
    });
  }

  private choiceText(edge: ChoiceEdge): BeatChoiceText {
    const text = APPROACH_TEXT[edge.approach];
    const risk =
      edge.check.difficulty <= 3
        ? "Low risk"
        : edge.check.difficulty <= 6
          ? "Risky"
          : "Very risky";

    return {
      intent: text.intent,
      label: text.label,
      riskHint: `${risk} — tests your ${edge.check.skill}.`,
    };
  }
}
