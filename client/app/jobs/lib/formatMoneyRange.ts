import type { Job } from "../../models/job";

export function formatMoneyRange(job: Job): string {
  return `$${job.rewardMin}-$${job.rewardMax}`;
}
