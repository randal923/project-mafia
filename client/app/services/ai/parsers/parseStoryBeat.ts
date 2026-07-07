import type { Job, JobStoryBeat } from "../../../models/job";
import { storyBeatPromptVersion } from "../promptVersions";
import { parseStoryScene } from "./parseStoryScene";

export function parseStoryBeat(
  value: unknown,
  job: Job,
  choiceDepth: number,
): JobStoryBeat | null {
  return parseStoryScene(value, job, storyBeatPromptVersion, choiceDepth);
}
