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
    "- Establish your position, the target, the watcher, and the exit through natural description.",
    "- Do not write the scene map as a checklist.",
    "- Use clear place words like gate, table, crates, door, alley, or office.",
    "- Use the job's storySeed as raw material, not copy for dialogue or narration.",
    "- Avoid generic phrases like shadows, chaos, destiny, heart pounding, or everything changes.",
    "- Avoid unclear poetic phrases, odd metaphors, compressed noir wording, and vague spaces.",
    "- Address the player as you. Do not use the player's name or nickname.",
    "- Use PLAYER_CONTEXT.loadout to shape what the player can try.",
    "- If equipped gear is useful, let one choice naturally use it without forcing violence.",
    "- Keep the player central without inventing major backstory beyond PLAYER_CONTEXT.",
    "",
    "Requirements:",
    "- The scene must happen in the Docks.",
    "- The job must be an easy robbery for the current player.",
    `- This is decision setup 1. The job may conclude after ${minimumJobStoryChoiceDepth}, 4, or ${maximumJobStoryChoiceDepth} choices.`,
    "- Do not stretch the job with filler beats once the main problem is ready to resolve.",
    "- Offer exactly two choices.",
    "- One choice should be quieter and lower heat. The other should use a clearly different approach.",
    "- If the player has a knife, it can cut, pry, threaten, or help at close range.",
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
      scene: "Exactly three clear sentences that orient the scene naturally.",
      stakes: "One clear sentence under 14 words.",
      title: "Short job title.",
    }),
  ].join("\n");
}
