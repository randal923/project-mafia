"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "../auth/useAuth";
import type { Job } from "../models/job";
import type { Player } from "../models/player";
import { JobsService } from "../services/jobs";
import { usePlayer } from "./usePlayer";

type UseJobsResult = {
  currentPlayerLoadError: string | null;
  isLoadingJobs: boolean;
  isSignedIn: boolean;
  jobs: Job[];
  jobsError: string | null;
  player: Player | null;
  selectJob: (jobId: string) => void;
  selectedJob: Job | null;
  selectedJobId: string | null;
  user: User | null;
};

export function useJobs(): UseJobsResult {
  const { user } = useAuth();
  const { currentLoadError, isSignedIn, player } = usePlayer();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    if (!user || !player) {
      return;
    }

    let isCancelled = false;

    const loadJobs = async () => {
      setIsLoadingJobs(true);
      setJobsError(null);
      const result = await JobsService.getJobs(user);

      if (isCancelled) {
        return;
      }

      setIsLoadingJobs(false);

      if (!result.ok) {
        setJobsError(result.error.message);
        return;
      }

      setJobs(result.jobs);
      setSelectedJobId((currentJobId) =>
        result.jobs.some((job) => job.id === currentJobId)
          ? currentJobId
          : result.jobs[0]?.id ?? null,
      );
    };

    void loadJobs();

    return () => {
      isCancelled = true;
    };
  }, [player, user]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId],
  );

  return {
    currentPlayerLoadError: currentLoadError,
    isLoadingJobs,
    isSignedIn,
    jobs,
    jobsError,
    player,
    selectJob: setSelectedJobId,
    selectedJob,
    selectedJobId,
    user,
  };
}
