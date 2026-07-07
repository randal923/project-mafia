"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import type {
  Job,
  JobStoryChoice,
  JobStoryOutcome,
  JobStoryScene,
} from "../models/job";
import { JobsService } from "../services/jobs";

type UseJobStoryInput = {
  onSelectJob: (jobId: string) => void;
  selectedJob: Job | null;
  user: User | null;
};

type UseJobStoryResult = {
  isStartingStory: boolean;
  outcome: JobStoryOutcome | null;
  resolvingChoiceId: string | null;
  resolveChoice: (choice: JobStoryChoice) => Promise<void>;
  selectJobForStory: (job: Job) => void;
  startStory: (job: Job) => Promise<void>;
  story: JobStoryScene | null;
  storyError: string | null;
  storyPath: JobStoryScene[];
};

export function useJobStory({
  onSelectJob,
  selectedJob,
  user,
}: UseJobStoryInput): UseJobStoryResult {
  const [storyError, setStoryError] = useState<string | null>(null);
  const [isStartingStory, setIsStartingStory] = useState(false);
  const [resolvingChoiceId, setResolvingChoiceId] = useState<string | null>(
    null,
  );
  const [story, setStory] = useState<JobStoryScene | null>(null);
  const [storyPath, setStoryPath] = useState<JobStoryScene[]>([]);
  const [choicePath, setChoicePath] = useState<JobStoryChoice[]>([]);
  const [outcome, setOutcome] = useState<JobStoryOutcome | null>(null);

  const resetStory = () => {
    setChoicePath([]);
    setStory(null);
    setStoryPath([]);
    setOutcome(null);
    setStoryError(null);
  };

  const selectJobForStory = (job: Job) => {
    onSelectJob(job.id);
    resetStory();
  };

  const startStory = async (job: Job) => {
    if (!user) {
      return;
    }

    onSelectJob(job.id);
    resetStory();
    setIsStartingStory(true);

    const result = await JobsService.createJobIntro(user, job.id);

    setIsStartingStory(false);

    if (!result.ok) {
      setStoryError(result.error.message);
      return;
    }

    setStory(result.story);
    setStoryPath([result.story]);
  };

  const resolveChoice = async (choice: JobStoryChoice) => {
    if (!user || !story || !selectedJob) {
      return;
    }

    setStoryError(null);
    setOutcome(null);
    setResolvingChoiceId(choice.id);

    const result = await JobsService.resolveJobChoice(
      user,
      selectedJob.id,
      story,
      choicePath,
      choice,
    );
    const nextChoicePath = [...choicePath, choice];

    setResolvingChoiceId(null);

    if (!result.ok) {
      setStoryError(result.error.message);
      return;
    }

    setChoicePath(nextChoicePath);

    if (result.resolution.type === "beat") {
      const nextStory = result.resolution.beat;

      setStory(nextStory);
      setStoryPath((currentPath) => [...currentPath, nextStory]);
      return;
    }

    setOutcome(result.resolution.outcome);
  };

  return {
    isStartingStory,
    outcome,
    resolvingChoiceId,
    resolveChoice,
    selectJobForStory,
    startStory,
    story,
    storyError,
    storyPath,
  };
}
