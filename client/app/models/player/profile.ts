import type { PlayerLoadout } from "./playerLoadout";
import type { PlayerNarrativeProfile } from "./playerNarrativeProfile";
import type { PlayerRank } from "./playerRank";
import type { PlayerResources } from "./playerResources";
import type { PlayerStatus } from "./playerStatus";

export interface Profile {
  name: string;
  nickname: string;
  resources: PlayerResources;
  status: PlayerStatus;
  rank: PlayerRank;
  loadout: PlayerLoadout;
  narrative: PlayerNarrativeProfile;
}
