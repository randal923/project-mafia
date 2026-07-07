import type { Job, JobIntroStory } from "../../../models/job";
import { introPromptVersion } from "../promptVersions";
import { parseStoryScene } from "./parseStoryScene";

export function parseIntroStory(
  value: unknown,
  job: Job,
): JobIntroStory | null {
  return parseStoryScene(value, job, introPromptVersion, 0);
}
