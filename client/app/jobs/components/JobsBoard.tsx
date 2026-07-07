"use client";

import { useJobStory } from "../../hooks/useJobStory";
import { useJobs } from "../../hooks/useJobs";
import { ErrorPanel } from "./ErrorPanel";
import { JobList } from "./JobList";
import { LoadingPanel } from "./LoadingPanel";
import { StoryPanel } from "./StoryPanel";

export function JobsBoard() {
  const {
    currentPlayerLoadError,
    isLoadingJobs,
    isSignedIn,
    jobs,
    jobsError,
    player,
    selectJob,
    selectedJob,
    user,
  } = useJobs();
  const {
    isStartingStory,
    outcome,
    resolvingChoiceId,
    resolveChoice,
    selectJobForStory,
    startStory,
    story,
    storyError,
    storyPath,
  } = useJobStory({
    onSelectJob: selectJob,
    selectedJob,
    user,
  });

  if (!isSignedIn) {
    return null;
  }

  if (currentPlayerLoadError) {
    return <ErrorPanel message={currentPlayerLoadError} />;
  }

  if (!player || isLoadingJobs) {
    return <LoadingPanel label={!player ? "Loading player" : "Loading jobs"} />;
  }

  if (jobsError) {
    return <ErrorPanel message={jobsError} />;
  }

  if (!selectedJob) {
    return <LoadingPanel label="No jobs available" />;
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
      <JobList
        isStartingStory={isStartingStory}
        jobs={jobs}
        onSelectJob={selectJobForStory}
        onStartJob={startStory}
        selectedJob={selectedJob}
      />

      <StoryPanel
        isStartingStory={isStartingStory}
        job={selectedJob}
        onResolveChoice={resolveChoice}
        outcome={outcome}
        resolvingChoiceId={resolvingChoiceId}
        story={story}
        storyError={storyError}
        storyPath={storyPath}
      />
    </section>
  );
}
