import type { PlayerReputation } from "./playerReputation";

export interface NarrativeEvent {
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
}
