import type { BattleReport } from "@shared/battle";
import type { BuildingDefinition, BuildingInstance } from "@shared/building";
import type {
  CrewMember,
  CrewRecruitmentPool,
  CrewSlotId,
} from "@shared/crew";
import type { Equipment } from "@shared/equipment";
import type { JobBoard, MissionView } from "@shared/job";
import type { NewspaperEdition } from "@shared/newspaper";
import type { PlayerNotification } from "@shared/notification";
import type { EquipmentSlotId, Player } from "@shared/player";
import type { PrisonAttemptResult, PrisonStatus } from "@shared/prison";
import type { RespectStanding, Season } from "@shared/season";
import type { TurfState } from "@shared/territory";
import type { User } from "firebase/auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  user: User,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await user.getIdToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init?.headers
    }
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }

    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export function fetchMyPlayer(user: User): Promise<Player> {
  return apiFetch<Player>(user, "/players/me");
}

export function createPlayer(user: User, name: string): Promise<Player> {
  return apiFetch<Player>(user, "/players", {
    body: JSON.stringify({ name }),
    method: "POST"
  });
}

export function fetchJobBoard(user: User): Promise<JobBoard> {
  return apiFetch<JobBoard>(user, "/jobs/board");
}

export function regenerateJobBoard(user: User): Promise<JobBoard> {
  return apiFetch<JobBoard>(user, "/jobs/board/regenerate", {
    method: "POST"
  });
}

export function acceptJob(
  user: User,
  offerId: string,
  crewIds: string[] = []
): Promise<{ mission: MissionView }> {
  return apiFetch<{ mission: MissionView }>(user, "/jobs/accept", {
    body: JSON.stringify({ crewIds, offerId }),
    method: "POST"
  });
}

export function fetchActiveMission(
  user: User
): Promise<{ mission: MissionView }> {
  return apiFetch<{ mission: MissionView }>(user, "/jobs/missions/active");
}

export function fetchStoreCatalog(
  user: User
): Promise<{ items: Equipment[] }> {
  return apiFetch<{ items: Equipment[] }>(user, "/store/catalog");
}

export function buyEquipment(
  user: User,
  equipmentId: string,
  quantity = 1
): Promise<{ player: Player }> {
  return apiFetch<{ player: Player }>(user, "/store/buy", {
    body: JSON.stringify({ equipmentId, quantity }),
    method: "POST"
  });
}

export function sellItem(
  user: User,
  itemId: string,
  quantity = 1
): Promise<{ player: Player }> {
  return apiFetch<{ player: Player }>(user, "/store/sell", {
    body: JSON.stringify({ itemId, quantity }),
    method: "POST"
  });
}

export function equipItem(user: User, itemId: string): Promise<Player> {
  return apiFetch<Player>(user, "/players/me/equip", {
    body: JSON.stringify({ itemId }),
    method: "POST"
  });
}

export function unequipSlot(
  user: User,
  slot: EquipmentSlotId
): Promise<Player> {
  return apiFetch<Player>(user, "/players/me/unequip", {
    body: JSON.stringify({ slot }),
    method: "POST"
  });
}

export function useInventoryItem(
  user: User,
  itemId: string
): Promise<Player> {
  return apiFetch<Player>(user, "/players/me/use", {
    body: JSON.stringify({ itemId }),
    method: "POST"
  });
}

export function fetchPrecinctQuote(
  user: User
): Promise<{ chunk: number; cost: number }> {
  return apiFetch<{ chunk: number; cost: number }>(
    user,
    "/players/me/precinct-quote"
  );
}

export function bribeHeat(user: User): Promise<Player> {
  return apiFetch<Player>(user, "/players/me/bribe-heat", { method: "POST" });
}

export function fetchPrisonStatus(user: User): Promise<PrisonStatus> {
  return apiFetch<PrisonStatus>(user, "/prison/status");
}

export function bribePrisonGuard(user: User): Promise<PrisonAttemptResult> {
  return apiFetch<PrisonAttemptResult>(user, "/prison/bribe", {
    method: "POST"
  });
}

export function escapePrison(user: User): Promise<PrisonAttemptResult> {
  return apiFetch<PrisonAttemptResult>(user, "/prison/escape", {
    method: "POST"
  });
}

export function chooseMissionOption(
  user: User,
  missionId: string,
  choiceId: string
): Promise<{ mission: MissionView; player: Player }> {
  return apiFetch<{ mission: MissionView; player: Player }>(
    user,
    `/jobs/missions/${missionId}/choose`,
    {
      body: JSON.stringify({ choiceId }),
      method: "POST"
    }
  );
}

// ---- Crew ----

export type CrewRosterResponse = { crew: CrewMember[]; player: Player };

export function fetchCrewRoster(user: User): Promise<CrewRosterResponse> {
  return apiFetch<CrewRosterResponse>(user, "/crew");
}

export function fetchRecruitmentPool(
  user: User
): Promise<{ pool: CrewRecruitmentPool }> {
  return apiFetch<{ pool: CrewRecruitmentPool }>(user, "/crew/recruitment");
}

export function hireCrewCandidate(
  user: User,
  candidateId: string
): Promise<CrewRosterResponse & { hired: CrewMember }> {
  return apiFetch<CrewRosterResponse & { hired: CrewMember }>(
    user,
    "/crew/hire",
    { body: JSON.stringify({ candidateId }), method: "POST" }
  );
}

export function fireCrewMember(
  user: User,
  memberId: string
): Promise<{ crew: CrewMember[] }> {
  return apiFetch<{ crew: CrewMember[] }>(user, "/crew/fire", {
    body: JSON.stringify({ memberId }),
    method: "POST"
  });
}

export function trainCrewMember(
  user: User,
  memberId: string
): Promise<CrewRosterResponse> {
  return apiFetch<CrewRosterResponse>(user, "/crew/train", {
    body: JSON.stringify({ memberId }),
    method: "POST"
  });
}

export function bribeCrewMember(
  user: User,
  memberId: string
): Promise<CrewRosterResponse> {
  return apiFetch<CrewRosterResponse>(user, "/crew/bribe", {
    body: JSON.stringify({ memberId }),
    method: "POST"
  });
}

export function equipCrewMember(
  user: User,
  memberId: string,
  itemId: string
): Promise<CrewRosterResponse> {
  return apiFetch<CrewRosterResponse>(user, "/crew/equip", {
    body: JSON.stringify({ itemId, memberId }),
    method: "POST"
  });
}

export function unequipCrewMember(
  user: User,
  memberId: string,
  slot: CrewSlotId
): Promise<CrewRosterResponse> {
  return apiFetch<CrewRosterResponse>(user, "/crew/unequip", {
    body: JSON.stringify({ memberId, slot }),
    method: "POST"
  });
}

// ---- Empire (personal holdings) ----

export type HoldingsResponse = {
  buildings: Array<BuildingInstance & { incomeRate: number }>;
  player: Player;
  slots: number;
};

export function fetchHoldings(user: User): Promise<HoldingsResponse> {
  return apiFetch<HoldingsResponse>(user, "/empire");
}

export function fetchBuildingCatalog(
  user: User
): Promise<{ catalog: BuildingDefinition[] }> {
  return apiFetch<{ catalog: BuildingDefinition[] }>(user, "/empire/catalog");
}

export function buyPersonalBuilding(
  user: User,
  definitionId: string
): Promise<HoldingsResponse> {
  return apiFetch<HoldingsResponse>(user, "/empire/buy", {
    body: JSON.stringify({ definitionId }),
    method: "POST"
  });
}

export function collectAllIncome(user: User): Promise<
  HoldingsResponse & {
    collected: number;
    raided: string | null;
    upkeep: number;
  }
> {
  return apiFetch<
    HoldingsResponse & {
      collected: number;
      raided: string | null;
      upkeep: number;
    }
  >(user, "/empire/collect", { method: "POST" });
}

export function upgradePersonalBuilding(
  user: User,
  buildingId: string
): Promise<HoldingsResponse> {
  return apiFetch<HoldingsResponse>(user, "/empire/upgrade", {
    body: JSON.stringify({ buildingId }),
    method: "POST"
  });
}

export function repairPersonalBuilding(
  user: User,
  buildingId: string
): Promise<HoldingsResponse> {
  return apiFetch<HoldingsResponse>(user, "/empire/repair", {
    body: JSON.stringify({ buildingId }),
    method: "POST"
  });
}

export function staffPersonalBuilding(
  user: User,
  buildingId: string,
  crewIds: string[]
): Promise<HoldingsResponse> {
  return apiFetch<HoldingsResponse>(user, "/empire/staff", {
    body: JSON.stringify({ buildingId, crewIds }),
    method: "POST"
  });
}

// ---- Map / territory ----

export type MapFamily = {
  color: string;
  name: string;
  turfCount: number;
  uid: string;
};

export type MapViewResponse = {
  families: MapFamily[];
  season: Season;
  turfs: TurfState[];
};

export function fetchMapView(user: User): Promise<MapViewResponse> {
  return apiFetch<MapViewResponse>(user, "/map");
}

export function foundFamily(
  user: User,
  color: string,
  name: string
): Promise<{ player: Player }> {
  return apiFetch<{ player: Player }>(user, "/map/family", {
    body: JSON.stringify({ color, name }),
    method: "POST"
  });
}

export function claimTurf(
  user: User,
  turfId: string,
  crewIds: string[] = []
): Promise<{ mission: MissionView }> {
  return apiFetch<{ mission: MissionView }>(user, "/map/claim", {
    body: JSON.stringify({ crewIds, turfId }),
    method: "POST"
  });
}

export function attackTurf(
  user: User,
  turfId: string,
  crewIds: string[]
): Promise<{ battle: BattleReport }> {
  return apiFetch<{ battle: BattleReport }>(user, "/map/attack", {
    body: JSON.stringify({ crewIds, turfId }),
    method: "POST"
  });
}

export function assignTurfDefense(
  user: User,
  turfId: string,
  crewIds: string[]
): Promise<{ turf: TurfState }> {
  return apiFetch<{ turf: TurfState }>(user, "/map/defense", {
    body: JSON.stringify({ crewIds, turfId }),
    method: "POST"
  });
}

export function buildRacket(
  user: User,
  turfId: string,
  definitionId: string
): Promise<{ turf: TurfState }> {
  return apiFetch<{ turf: TurfState }>(user, "/map/build", {
    body: JSON.stringify({ definitionId, turfId }),
    method: "POST"
  });
}

export function upgradeRacket(
  user: User,
  turfId: string,
  buildingId: string
): Promise<{ turf: TurfState }> {
  return apiFetch<{ turf: TurfState }>(user, "/map/upgrade", {
    body: JSON.stringify({ buildingId, turfId }),
    method: "POST"
  });
}

export function repairRacket(
  user: User,
  turfId: string,
  buildingId: string
): Promise<{ turf: TurfState }> {
  return apiFetch<{ turf: TurfState }>(user, "/map/repair", {
    body: JSON.stringify({ buildingId, turfId }),
    method: "POST"
  });
}

export function staffRacket(
  user: User,
  turfId: string,
  buildingId: string,
  crewIds: string[]
): Promise<{ turf: TurfState }> {
  return apiFetch<{ turf: TurfState }>(user, "/map/staff", {
    body: JSON.stringify({ buildingId, crewIds, turfId }),
    method: "POST"
  });
}

export function fetchBattles(
  user: User
): Promise<{ battles: BattleReport[] }> {
  return apiFetch<{ battles: BattleReport[] }>(user, "/map/battles");
}

// ---- Season / newspaper / rankings ----

export function fetchSeason(user: User): Promise<{ season: Season }> {
  return apiFetch<{ season: Season }>(user, "/season");
}

export function fetchRankings(
  user: User
): Promise<{ season: Season; standings: RespectStanding[] }> {
  return apiFetch<{ season: Season; standings: RespectStanding[] }>(
    user,
    "/season/rankings"
  );
}

export function fetchLatestEdition(
  user: User
): Promise<{ edition: NewspaperEdition | null }> {
  return apiFetch<{ edition: NewspaperEdition | null }>(
    user,
    "/season/newspaper"
  );
}

export function fetchEditionArchive(
  user: User
): Promise<{ editions: NewspaperEdition[] }> {
  return apiFetch<{ editions: NewspaperEdition[] }>(
    user,
    "/season/newspaper/archive"
  );
}

// ---- Notifications ----

export function fetchNotifications(
  user: User
): Promise<{ notifications: PlayerNotification[] }> {
  return apiFetch<{ notifications: PlayerNotification[] }>(
    user,
    "/notifications"
  );
}

export function markNotificationsRead(user: User): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(user, "/notifications/read-all", {
    method: "POST"
  });
}
