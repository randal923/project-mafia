import type { Job } from "../../../models/job";
import {
  maximumJobStoryChoiceDepth,
  minimumJobStoryChoiceDepth,
} from "../../../models/job";
import type { Player } from "../../../models/player";
import { createPlayerPromptContext } from "./createPlayerPromptContext";

export function createIntroPrompt(player: Player, job: Job): string {
  return [
    "Create the opening scene for this generated job.",
    "",
    `PLAYER_CONTEXT=${JSON.stringify(createPlayerPromptContext(player))}`,
    `ENGINE_JOB=${JSON.stringify(job)}`,
    "",
    "Writing standards:",
    "- Write polished, playable crime fiction in clear, plain English.",
    "- Lead with an action or image from the location, not background exposition.",
    "- Write exactly three scene sentences, each 8-18 words.",
    "- Use simple words and clear physical details the player can picture.",
    "- Each sentence should show the place, what someone does, or what can go wrong.",
    "- Use the job's storySeed as raw material, not copy for dialogue or narration.",
    "- Avoid generic phrases like shadows, chaos, destiny, heart pounding, or everything changes.",
    "- Avoid unclear poetic phrases, odd metaphors, and compressed noir wording.",
    "- Address the player as you. Do not use the player's name or nickname.",
    "- Keep the player central without inventing major backstory beyond PLAYER_CONTEXT.",
    "",
    "Requirements:",
    "- The scene must happen in the Docks.",
    "- The job must be an easy robbery for the current player.",
    `- This is decision setup 1 of ${maximumJobStoryChoiceDepth}; the job must not conclude until the player has made ${minimumJobStoryChoiceDepth}-${maximumJobStoryChoiceDepth} choices.`,
    "- Offer exactly two choices.",
    "- One choice should be quieter and lower heat. The other should use a clearly different approach.",
    "- Choice labels must be two to four simple words.",
    "- Choice intents must be one clear sentence under 12 words.",
    "- Risk hints must be under seven words and name a clear danger.",
    "- Choice text should read like fast UI copy, not prose.",
    "",
    "Return this JSON shape:",
    JSON.stringify({
      choices: [
        {
          approach: "quiet",
          id: "quiet",
          intent: "Wait for the clerk to look away.",
          label: "Wait Quietly",
          riskHint: "Lookout may notice.",
        },
        {
          approach: "force",
          id: "force",
          intent: "Step in fast and grab it.",
          label: "Grab Fast",
          riskHint: "Clerk may shout.",
        },
      ],
      choiceDepth: 0,
      scene: "Exactly three clear sentences of intro fiction.",
      stakes: "One clear sentence under 14 words.",
      title: "Short job title.",
    }),
  ].join("\n");
}
