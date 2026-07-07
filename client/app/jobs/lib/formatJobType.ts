import type { Job } from "../../models/job";

export function formatJobType(type: Job["type"]): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
