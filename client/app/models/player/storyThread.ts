export interface StoryThread {
  id: string;
  status: "active" | "resolved" | "failed" | "abandoned";
  title: string;
  summary: string;
  relatedDistrictIds: string[];
  relatedFactionIds: string[];
  tension: number;
  priority: number;
  possibleNextBeats: string[];
}
