import type { Profile } from "./profileModel";

type CreateDefaultProfileInput = {
  name: string;
};

export function createDefaultProfile({
  name,
}: CreateDefaultProfileInput): Profile {
  return {
    name,
    nickname: "",
    resources: {
      cleanMoney: 50,
      dirtyMoney: 0,
      influence: 0,
      power: 3,
      heat: 0,
      actionPoints: 10,
      maxActionPoints: 10,
    },
    status: "active",
    rank: "nobody",
    narrative: {
      origin: "ambitious_unknown",
      personality: {
        style: "calculated",
        moralCode: "loyal_to_crew",
        preferredApproach: "negotiation",
      },
      storySummary: "",
      majorEvents: [],
      activeStoryThreads: [],
      llmMemory: {
        importantFacts: [],
        recurringCharacters: [],
        unresolvedConflicts: [],
        preferredJobThemes: [],
      },
    },
  };
}
