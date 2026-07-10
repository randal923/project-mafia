"use client";

import type { MissionView } from "@shared/job";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../components/AuthProvider/AuthProvider";
import { usePlayer } from "../../../components/PlayerProvider/PlayerProvider";
import {
  ApiError,
  chooseMissionOption,
  fetchActiveMission,
  useInventoryItem as consumeInventoryItem
} from "../../../lib/api";

export type MissionStatus = "error" | "loading" | "none" | "ready";

const POLL_INTERVAL_MS = 2000;

/**
 * A poll response that was already in flight when a choice landed carries
 * pre-choice state; applying it would visually undo the click. Only accept
 * fetched state that is at least as advanced as what we already show.
 */
function isAtLeastAsAdvanced(
  next: MissionView,
  prev: MissionView | null
): boolean {
  if (!prev || next.id !== prev.id) {
    return true;
  }
  if (next.steps.length !== prev.steps.length) {
    return next.steps.length > prev.steps.length;
  }
  return next.updatedAt >= prev.updatedAt;
}

export function useMission() {
  const { user } = useAuth();
  const { setPlayer } = usePlayer();
  const [mission, setMission] = useState<MissionView | null>(null);
  const [status, setStatus] = useState<MissionStatus>("loading");
  const [isChoosing, setIsChoosing] = useState(false);
  const [healingError, setHealingError] = useState<string | null>(null);
  const [healingItemId, setHealingItemId] = useState<string | null>(null);
  const [pollKey, setPollKey] = useState(0);
  const actionInFlight = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    fetchActiveMission(user)
      .then(({ mission: active }) => {
        if (!isCancelled) {
          setMission((prev) =>
            isAtLeastAsAdvanced(active, prev) ? active : prev
          );
          setStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setMission(null);
          setStatus("none");
          return;
        }
        console.error("Failed to load the active mission:", error);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [pollKey, user]);

  // Poll while the server is still writing narration for the current beat.
  const lastStep = mission?.steps[mission.steps.length - 1];
  const needsPolling =
    mission !== null &&
    (mission.status === "generating" || lastStep?.narrative === null);

  useEffect(() => {
    if (!needsPolling) {
      return;
    }

    const interval = setInterval(() => {
      setPollKey((key) => key + 1);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [needsPolling]);

  const choose = useCallback(
    async (choiceId: string) => {
      // Ref guard: two clicks in the same render tick both see
      // isChoosing === false, so state alone can double-submit.
      if (!user || !mission || actionInFlight.current) {
        return;
      }

      actionInFlight.current = true;
      setHealingError(null);
      setIsChoosing(true);
      try {
        const result = await chooseMissionOption(user, mission.id, choiceId);
        setMission(result.mission);
        if (result.player) {
          setPlayer(result.player);
        }
      } catch (error) {
        if (error instanceof ApiError && error.message === "still_generating") {
          // The next scene is not written yet; polling will pick it up.
          return;
        }
        console.error("Failed to submit the choice:", error);
      } finally {
        actionInFlight.current = false;
        setIsChoosing(false);
      }
    },
    [mission, setPlayer, user]
  );

  const heal = useCallback(
    async (itemId: string) => {
      if (!user || !mission || actionInFlight.current) {
        return;
      }

      actionInFlight.current = true;
      setHealingError(null);
      setHealingItemId(itemId);
      try {
        setPlayer(await consumeInventoryItem(user, itemId));
      } catch (error) {
        console.error("Failed to use healing item:", error);
        setHealingError(
          error instanceof ApiError
            ? error.message
            : "That kit could not be used. Refresh and try again."
        );
      } finally {
        actionInFlight.current = false;
        setHealingItemId(null);
      }
    },
    [mission, setPlayer, user]
  );

  const startMission = useCallback((view: MissionView) => {
    setMission(view);
    setStatus("ready");
  }, []);

  const clearMission = useCallback(() => {
    setMission(null);
    setStatus("none");
  }, []);

  return {
    choose,
    clearMission,
    heal,
    healingError,
    healingItemId,
    isChoosing,
    mission,
    startMission,
    status
  };
}
