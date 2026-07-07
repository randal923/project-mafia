import type { Job, JobStoryChoice, JobStoryScene } from "../../../models/job";
import {
  maximumJobStoryChoiceDepth,
  minimumJobStoryChoiceDepth,
} from "../../../models/job";
import type { Player } from "../../../models/player";
import { createPlayerPromptContext } from "./createPlayerPromptContext";

export function createChoicePrompt(
  player: Player,
  job: Job,
  story: JobStoryScene,
  choicePath: JobStoryChoice[],
  choice: JobStoryChoice,
): string {
  return [
    "Resolve the job after the player's completed choice path.",
    "",
    `PLAYER_CONTEXT=${JSON.stringify(createPlayerPromptContext(player))}`,
    `ENGINE_JOB=${JSON.stringify(job)}`,
    `CURRENT_SCENE=${JSON.stringify(story)}`,
    `CHOICE_PATH=${JSON.stringify(choicePath)}`,
    `PLAYER_CHOICE=${JSON.stringify(choice)}`,
    "",
    "Writing standards:",
    "- The narration should feel earned by CHOICE_PATH, not like a generic success or failure.",
    "- Pay off at least two concrete details from the path and show the final consequence in action.",
    "- Keep the prose clear, vivid, and grounded. Avoid melodrama, victory speeches, and vague summary.",
    "- Write four clear sentences. Keep each sentence 8-18 words.",
    "- Use simple words and direct consequences, not long explanation.",
    "- Avoid unclear poetic phrases, odd metaphors, and compressed noir wording.",
    "- Address the player as you. Do not use the player's name or nickname, even if CHOICE_PATH does.",
    "- End with a small future-facing hook or memory, not a cliffhanger that invalidates the conclusion.",
    "",
    "Outcome guidance:",
    `- Resolve only because the player has made ${minimumJobStoryChoiceDepth}-${maximumJobStoryChoiceDepth} choices on this job path.`,
    "- Use the job reward range as the normal cash result.",
    "- A clean success should usually pay inside the range.",
    "- A mixed or costly success may pay less, add heat, cause a minor wound, or hurt faction respect.",
    "- A failure may pay nothing or a token amount, but should still advance the story.",
    "- Rarely, if the fiction strongly supports it, the player can find one extra item worth more than the job, up to $500 for this starter tier.",
    "- Keep the result plausible for the player's low rank and Docks location.",
    "",
    "Return this JSON shape:",
    JSON.stringify({
      factionRespectChange: job.factionImpact.respectChange,
      foundItem: {
        consequence: "Why the item matters or who might come looking for it.",
        estimatedValue: 0,
        name: "",
      },
      heatChange: job.heatIncrease,
      moneyChange: job.rewardMin,
      narration: "Four clear sentences resolving the full path.",
      outcome: "mixed_success",
      storySummary: "One short sentence suitable for future memory.",
      title: "Short outcome title.",
      wound: null,
    }),
  ].join("\n");
}
