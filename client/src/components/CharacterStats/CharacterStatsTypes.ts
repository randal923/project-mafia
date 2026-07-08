export type PlayerStatus = "active" | "dead" | "imprisoned" | "retired";

export type PlayerResources = {
  actionPoints: number;
  cleanMoney: number;
  dirtyMoney: number;
  heat: number;
  influence: number;
  maxActionPoints: number;
  money: number;
  power: number;
};

export type PlayerSkills = {
  business: number;
  corruption: number;
  leadership: number;
  muscle: number;
  stealth: number;
  strategy: number;
};

export type PlayerProgression = {
  experience: number;
  level: number;
  skillPoints: number;
  skills: PlayerSkills;
};

export type PlayerReputation = {
  ambition: number;
  betrayal: number;
  brutality: number;
  fear: number;
  knownFor: readonly string[];
  loyalty: number;
  reliability: number;
  respect: number;
};

export type CrewSpecialists = {
  drivers: number;
  enforcers: number;
  fixers: number;
  hackers: number;
  negotiators: number;
};

export type PlayerCrew = {
  availableMembers: number;
  discipline: number;
  intelligence: number;
  loyalty: number;
  muscle: number;
  specialists: CrewSpecialists;
  totalMembers: number;
  woundedMembers: number;
};

export type PlayerTerritory = {
  businessesOwned: number;
  contestedDistrictIds: readonly string[];
  controlledDistrictIds: readonly string[];
  districtInfluence: Readonly<Record<string, number>>;
  safehousesOwned: number;
};

export type PlayerRelationship = {
  id: string;
  name: string;
  standing: number;
};

export type PlayerPersonality = {
  moralCode: string;
  preferredApproach: string;
  style: string;
};

export type PlayerLlmMemory = {
  importantFacts: readonly string[];
  preferredJobThemes: readonly string[];
  recurringCharacters: readonly string[];
  unresolvedConflicts: readonly string[];
};

export type PlayerNarrative = {
  activeStoryThreads: readonly string[];
  llmMemory: PlayerLlmMemory;
  majorEvents: readonly string[];
  origin: string;
  personality: PlayerPersonality;
  storySummary: string;
};

export type PlayerProfile = {
  crew: PlayerCrew;
  id: string;
  name: string;
  narrative: PlayerNarrative;
  progression: PlayerProgression;
  rank: string;
  relationships: readonly PlayerRelationship[];
  reputation: PlayerReputation;
  resources: PlayerResources;
  seasonId: string;
  status: PlayerStatus;
  territory: PlayerTerritory;
  title: string;
  userId: string;
};
