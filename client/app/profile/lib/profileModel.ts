export type PlayerStatus =
  | "active"
  | "defeated"
  | "inactive"
  | "protected"
  | "banned";

export type PlayerRank =
  | "nobody"
  | "street_hustler"
  | "crew_leader"
  | "local_boss"
  | "district_boss"
  | "crime_lord"
  | "city_kingpin";

export type PlayerResources = {
  cleanMoney: number;
  dirtyMoney: number;
  influence: number;
  power: number;
  heat: number;
  actionPoints: number;
  maxActionPoints: number;
};

export type PlayerReputation = {
  fear: number;
  respect: number;
  notoriety: number;
};

export type PlayerOrigin =
  | "broke_outsider"
  | "local_street_kid"
  | "exiled_family_member"
  | "former_fixers_apprentice"
  | "ambitious_unknown"
  | "fallen_business_owner";

export type PlayerPersonality = {
  style:
    | "aggressive"
    | "calculated"
    | "charismatic"
    | "paranoid"
    | "business_minded"
    | "reckless";
  moralCode:
    | "no_code"
    | "loyal_to_crew"
    | "protects_locals"
    | "money_above_all"
    | "power_above_all";
  preferredApproach:
    | "force"
    | "stealth"
    | "corruption"
    | "negotiation"
    | "economic_control";
};

export type NarrativeEvent = {
  id: string;
  occurredAt: string;
  type:
    | "job_success"
    | "job_failure"
    | "betrayal"
    | "alliance"
    | "war_started"
    | "war_won"
    | "district_taken"
    | "crew_member_lost"
    | "major_reputation_change";
  districtId?: string;
  relatedFactionIds?: string[];
  title: string;
  summary: string;
  mechanicalImpact?: {
    moneyChange?: number;
    heatChange?: number;
    reputationChange?: Partial<PlayerReputation>;
    districtInfluenceChange?: Record<string, number>;
  };
};

export type StoryThread = {
  id: string;
  status: "active" | "resolved" | "failed" | "abandoned";
  title: string;
  summary: string;
  relatedDistrictIds: string[];
  relatedFactionIds: string[];
  tension: number;
  priority: number;
  possibleNextBeats: string[];
};

export type PlayerNarrativeProfile = {
  origin: PlayerOrigin;
  personality: PlayerPersonality;
  storySummary: string;
  majorEvents: NarrativeEvent[];
  activeStoryThreads: StoryThread[];
  llmMemory: {
    importantFacts: string[];
    recurringCharacters: string[];
    unresolvedConflicts: string[];
    preferredJobThemes: string[];
  };
};

export type Profile = {
  name: string;
  nickname: string;
  resources: PlayerResources;
  status: PlayerStatus;
  rank: PlayerRank;
  narrative: PlayerNarrativeProfile;
};
