import type { Equipment } from "@shared/equipment";
import type { JobBoard, MissionView } from "@shared/job";
import type { EquipmentSlotId, Player } from "@shared/player";
import type { PrisonAttemptResult, PrisonStatus } from "@shared/prison";
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
  offerId: string
): Promise<{ mission: MissionView }> {
  return apiFetch<{ mission: MissionView }>(user, "/jobs/accept", {
    body: JSON.stringify({ offerId }),
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
): Promise<{ mission: MissionView; player: Player | null }> {
  return apiFetch<{ mission: MissionView; player: Player | null }>(
    user,
    `/jobs/missions/${missionId}/choose`,
    {
      body: JSON.stringify({ choiceId }),
      method: "POST"
    }
  );
}
