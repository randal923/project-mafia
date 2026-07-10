"use client";

import type { JobBoard, MissionView } from "@shared/job";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider/AuthProvider";
import { acceptJob, fetchJobBoard, regenerateJobBoard } from "../../../lib/api";

export type JobBoardStatus = "error" | "loading" | "ready";

export function useJobBoard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<JobBoard | null>(null);
  const [status, setStatus] = useState<JobBoardStatus>("loading");
  const [isBusy, setIsBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    fetchJobBoard(user)
      .then((nextBoard) => {
        if (!isCancelled) {
          setBoard(nextBoard);
          setStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          console.error("Failed to load the job board:", error);
          setStatus("error");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [reloadKey, user]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const regenerate = useCallback(async () => {
    if (!user || isBusy) {
      return;
    }

    setIsBusy(true);
    try {
      setBoard(await regenerateJobBoard(user));
      setStatus("ready");
    } catch (error) {
      console.error("Failed to regenerate the job board:", error);
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, user]);

  const accept = useCallback(
    async (offerId: string): Promise<MissionView | null> => {
      if (!user || isBusy) {
        return null;
      }

      setIsBusy(true);
      try {
        const { mission } = await acceptJob(user, offerId);
        return mission;
      } catch (error) {
        console.error("Failed to accept the job:", error);
        return null;
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, user]
  );

  return { accept, board, isBusy, reload, regenerate, status };
}
