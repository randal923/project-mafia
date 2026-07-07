import {
  jobStoryChoiceApproaches,
  type JobStoryChoiceApproach,
} from "../../../models/job";

export function readStoryChoiceApproach(
  value: unknown,
): JobStoryChoiceApproach | null {
  if (typeof value !== "string") {
    return null;
  }

  return jobStoryChoiceApproaches.includes(value as JobStoryChoiceApproach)
    ? (value as JobStoryChoiceApproach)
    : null;
}
