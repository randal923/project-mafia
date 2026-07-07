import type { JobStoryChoice } from "../../../models/job";
import { isRecord } from "./isRecord";
import { readStoryChoiceApproach } from "./readStoryChoiceApproach";
import { readString } from "./readString";

export function parseStoryChoice(value: unknown): JobStoryChoice | null {
  if (!isRecord(value)) {
    return null;
  }

  const approach = readStoryChoiceApproach(value.approach);
  const id = readString(value.id);
  const intent = readString(value.intent);
  const label = readString(value.label);
  const riskHint = readString(value.riskHint);

  if (!approach || !id || !intent || !label || !riskHint) {
    return null;
  }

  return {
    approach,
    id,
    intent,
    label,
    riskHint,
  };
}
