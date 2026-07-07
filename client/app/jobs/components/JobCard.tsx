import { Button } from "../../components/Button";
import type { Job } from "../../models/job";
import { formatJobType } from "../lib/formatJobType";
import { formatMoneyRange } from "../lib/formatMoneyRange";
import { JobStat } from "./JobStat";

type JobCardProps = {
  isStartingStory: boolean;
  isSelected: boolean;
  job: Job;
  onSelect: () => void;
  onStart: () => void;
  startLabel: string;
};

export function JobCard({
  isStartingStory,
  isSelected,
  job,
  onSelect,
  onStart,
  startLabel,
}: JobCardProps) {
  return (
    <article
      className={`border bg-charcoal/35 p-4 ${
        isSelected ? "border-line-strong" : "border-line"
      }`}
    >
      <button className="block w-full text-left" onClick={onSelect} type="button">
        <p className="text-xs uppercase tracking-widest text-ash">
          {job.district}
        </p>
        <h2 className="mt-1 font-serif text-3xl font-bold uppercase tracking-widest text-ivory">
          {formatJobType(job.type)}
        </h2>
        <p className="mt-3 text-sm leading-6 text-parchment">
          {job.storySeed.premise}
        </p>
      </button>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <JobStat label="Difficulty" value={job.difficulty} />
        <JobStat label="Crew" value={job.requiredCrew} />
        <JobStat label="Risk" value={`${job.risk}%`} />
        <JobStat label="Reward" value={formatMoneyRange(job)} />
        <JobStat label="Heat" value={`+${job.heatIncrease}`} />
        <JobStat
          label={job.factionImpact.targetFaction}
          value={job.factionImpact.respectChange}
        />
      </dl>

      <Button
        className="mt-4"
        disabled={isStartingStory}
        fullWidth
        onClick={onStart}
      >
        {startLabel}
      </Button>
    </article>
  );
}
