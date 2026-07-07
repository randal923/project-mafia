import type { JobStoryOutcome } from "../../models/job";

export function formatOutcome(outcome: JobStoryOutcome["outcome"]): string {
  return outcome.replace(/_/g, " ");
}
