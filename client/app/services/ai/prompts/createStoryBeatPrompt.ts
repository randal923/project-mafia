import type { Job, JobStoryChoice, JobStoryScene } from "../../../models/job";
import {
  maximumJobStoryChoiceDepth,
  minimumJobStoryChoiceDepth,
} from "../../../models/job";
import type { Player } from "../../../models/player";
import { createPlayerPromptContext } from "./createPlayerPromptContext";

export function createStoryBeatPrompt(
  player: Player,
  job: Job,
  story: JobStoryScene,
  choicePath: JobStoryChoice[],
  choice: JobStoryChoice,
): string {
  return [
    "Continue the job with the next playable story beat.",
    "",
    `PLAYER_CONTEXT=${JSON.stringify(createPlayerPromptContext(player))}`,
    `ENGINE_JOB=${JSON.stringify(job)}`,
    `CURRENT_SCENE=${JSON.stringify(story)}`,
    `CHOICE_PATH=${JSON.stringify(choicePath)}`,
    `PLAYER_CHOICE=${JSON.stringify(choice)}`,
    "",
    "Writing standards:",
    "- Show the immediate consequence of PLAYER_CHOICE through action, dialogue pressure, or a changed physical situation.",
    "- Pay off one concrete detail from CURRENT_SCENE, then introduce one new complication or opening.",
    "- Keep the prose clear, specific, and grounded. Avoid melodrama, recap-heavy narration, and generic crime phrasing.",
    "- Write exactly three scene sentences, each 8-18 words.",
    "- Use simple words and clear physical details the player can picture.",
    "- Each sentence should show what changes, what someone does, or what can go wrong.",
    "- Avoid unclear poetic phrases, odd metaphors, and compressed noir wording.",
    "- Address the player as you. Do not use the player's name or nickname, even if CURRENT_SCENE does.",
    "- The player should feel that this beat only happened because of the selected path.",
    "",
    "Branching requirements:",
    `- This beat follows player decision ${choicePath.length} of ${maximumJobStoryChoiceDepth}.`,
    `- Do not conclude the job before ${minimumJobStoryChoiceDepth}-${maximumJobStoryChoiceDepth} player choices have shaped the path.`,
    "- Return exactly two new choices for the next decision.",
    "- The two choices must create meaningfully different risks, not just different wording for the same tactic.",
    "- Choice labels must be two to four simple words.",
    "- Choice intents must be one clear sentence under 12 words.",
    "- Risk hints must be under seven words and name a clear danger.",
    "- Choice text should read like fast UI copy, not prose.",
    "- Keep the job plausible for the player's low rank, current resources, and Docks location.",
    "",
    "Return this JSON shape:",
    JSON.stringify({
      choices: [
        {
          approach: "quiet",
          id: "quiet-next",
          intent: "Move closer behind the crates.",
          label: "Move Closer",
          riskHint: "Lookout may hear.",
        },
        {
          approach: "social",
          id: "social-next",
          intent: "Send the lookout toward the gate.",
          label: "Distract Him",
          riskHint: "He may shout.",
        },
      ],
      choiceDepth: choicePath.length,
      scene: "Exactly three clear sentences continuing the path.",
      stakes: "One clear sentence under 14 words.",
      title: "Short beat title.",
    }),
  ].join("\n");
}
