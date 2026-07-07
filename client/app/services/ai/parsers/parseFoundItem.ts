import type { JobStoryFoundItem } from "../../../models/job";
import { isRecord } from "./isRecord";
import { readNumber } from "./readNumber";
import { readString } from "./readString";

export function parseFoundItem(value: unknown): JobStoryFoundItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name);
  const consequence = readString(value.consequence);
  const estimatedValue = readNumber(value.estimatedValue, 0);

  if (!name || !consequence || estimatedValue <= 0) {
    return null;
  }

  return {
    consequence,
    estimatedValue,
    name,
  };
}
