import type { Job } from "../../models/job";
import { JobCard } from "./JobCard";

type JobListProps = {
  isStartingStory: boolean;
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onStartJob: (job: Job) => Promise<void>;
  selectedJob: Job;
};

export function JobList({
  isStartingStory,
  jobs,
  onSelectJob,
  onStartJob,
  selectedJob,
}: JobListProps) {
  return (
    <div className="space-y-4 lg:col-span-1">
      {jobs.map((job) => (
        <JobCard
          isStartingStory={isStartingStory}
          isSelected={job.id === selectedJob.id}
          job={job}
          key={job.id}
          onSelect={() => onSelectJob(job)}
          onStart={() => {
            void onStartJob(job);
          }}
          startLabel={
            isStartingStory && job.id === selectedJob.id
              ? "Starting"
              : "Start job"
          }
        />
      ))}
    </div>
  );
}
