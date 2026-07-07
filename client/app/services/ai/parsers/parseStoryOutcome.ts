import type { Job, JobStoryOutcome } from "../../../models/job";
import { outcomePromptVersion } from "../promptVersions";
import type { JsonObject } from "../types";
import { parseFoundItem } from "./parseFoundItem";
import { readNullableString } from "./readNullableString";
import { readNumber } from "./readNumber";
import { readStoryOutcomeType } from "./readStoryOutcomeType";
import { readString } from "./readString";

export function parseStoryOutcome(
  value: JsonObject,
  job: Job,
): JobStoryOutcome | null {
  const title = readString(value.title);
  const narration = readString(value.narration);
  const outcome = readStoryOutcomeType(value.outcome);
  const storySummary = readString(value.storySummary);

  if (!title || !narration || !outcome || !storySummary) {
    return null;
  }

  return {
    factionRespectChange: readNumber(
      value.factionRespectChange,
      job.factionImpact.respectChange,
    ),
    foundItem: parseFoundItem(value.foundItem),
    heatChange: readNumber(value.heatChange, job.heatIncrease),
    jobId: job.id,
    moneyChange: readNumber(value.moneyChange, 0),
    narration,
    outcome,
    promptVersion: outcomePromptVersion,
    storySummary,
    title,
    wound: readNullableString(value.wound),
  };
}
