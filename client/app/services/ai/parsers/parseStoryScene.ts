import type { Job, JobStoryScene } from "../../../models/job";
import { maximumJobStoryChoiceDepth } from "../../../models/job";
import { isRecord } from "./isRecord";
import { isStoryChoice } from "./isStoryChoice";
import { parseStoryChoice } from "./parseStoryChoice";
import { readNumber } from "./readNumber";
import { readString } from "./readString";

export function parseStoryScene(
  value: unknown,
  job: Job,
  promptVersion: string,
  fallbackChoiceDepth: number,
): JobStoryScene | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title);
  const scene = readString(value.scene);
  const stakes = readString(value.stakes);
  const choices = Array.isArray(value.choices)
    ? value.choices.map(parseStoryChoice).filter(isStoryChoice)
    : [];
  const choiceDepth = readNumber(value.choiceDepth, fallbackChoiceDepth);

  if (!title || !scene || !stakes || choices.length !== 2) {
    return null;
  }

  if (choiceDepth < 0 || choiceDepth > maximumJobStoryChoiceDepth) {
    return null;
  }

  return {
    choices,
    choiceDepth,
    district: job.district,
    jobId: job.id,
    promptVersion,
    scene,
    stakes,
    title,
  };
}
