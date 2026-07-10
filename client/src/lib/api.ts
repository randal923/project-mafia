import type { JobBoard, MissionView } from "@shared/job";
import type { Player } from "@shared/player";
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
