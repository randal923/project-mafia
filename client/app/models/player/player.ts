import type { PlayerLoadout } from "./playerLoadout";
import type { PlayerNarrative } from "./playerNarrative";
import type { PlayerRank } from "./playerRank";
import type { PlayerResources } from "./playerResources";
import type { PlayerStatus } from "./playerStatus";

export interface Player {
  name: string;
  nickname: string;
  resources: PlayerResources;
  status: PlayerStatus;
  rank: PlayerRank;
  loadout: PlayerLoadout;
  narrative: PlayerNarrative;
}
