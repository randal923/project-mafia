import type { JobStoryChoice } from "../../../models/job";

export function isStoryChoice(
  value: JobStoryChoice | null,
): value is JobStoryChoice {
  return value !== null;
}
