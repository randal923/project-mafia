import type { JobStoryOutcomeType } from "../../../models/job";

const storyOutcomeTypes: JobStoryOutcomeType[] = [
  "clean_success",
  "complication",
  "costly_success",
  "failure",
  "mixed_success",
];

export function readStoryOutcomeType(
  value: unknown,
): JobStoryOutcomeType | null {
  if (typeof value !== "string") {
    return null;
  }

  return storyOutcomeTypes.includes(value as JobStoryOutcomeType)
    ? (value as JobStoryOutcomeType)
    : null;
}
