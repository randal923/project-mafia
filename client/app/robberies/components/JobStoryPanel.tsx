"use client";

import { useState } from "react";
import type { Job, JobRisk } from "../lib/jobTypes";

type JobStoryPanelProps = {
  job: Job;
};

const riskClassNameByRisk: Record<JobRisk, string> = {
  high: "border-blood/55 bg-blood/15 text-[#5b1712]",
  low: "border-olive/45 bg-olive/15 text-[#3f4222]",
  medium: "border-brass/50 bg-brass/15 text-[#68411f]",
};

const riskLabelByRisk: Record<JobRisk, string> = {
  high: "High risk",
  low: "Low risk",
  medium: "Medium risk",
};

export function JobStoryPanel({ job }: JobStoryPanelProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    job.story.choices[0]?.id ?? null,
  );
  const selectedChoice =
    job.story.choices.find((choice) => choice.id === selectedChoiceId) ?? null;

  return (
    <aside
      aria-labelledby={`${job.id}-story-title`}
      className="relative z-40 mx-4 mb-4 mt-[39rem] max-h-[31rem] overflow-auto rounded-[3px] border border-obsidian/25 bg-[linear-gradient(180deg,#e1d8bd,#bfa874)] p-4 text-obsidian shadow-[0_22px_48px_rgb(0_0_0_/_0.34)] sm:mx-6 sm:mt-[37rem] lg:absolute lg:bottom-[5%] lg:right-[4%] lg:mx-0 lg:mb-0 lg:mt-0 lg:w-[34rem]"
    >
      <span className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-ivory/45 shadow-[0_2px_5px_rgb(0_0_0_/_0.24)]" />
      <div className="border-b border-obsidian/20 pb-3">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#5e4d2f]">
          Story
        </p>
        <h2
          id={`${job.id}-story-title`}
          className="font-serif text-3xl font-bold leading-none"
        >
          {job.name}
        </h2>
        <p className="mt-2 text-sm leading-5 text-[#352a1b]">
          {job.story.intro}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {job.story.choices.map((choice) => {
          const isSelected = choice.id === selectedChoiceId;

          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={isSelected}
              className={`rounded-[3px] border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-obsidian/70 ${
                isSelected
                  ? "border-obsidian/45 bg-obsidian/12"
                  : "border-obsidian/15 bg-ivory/13 hover:border-obsidian/35 hover:bg-ivory/25"
              }`}
              onClick={() => setSelectedChoiceId(choice.id)}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.13em]">
                {choice.label}
              </span>
              <span className="mt-1 block text-xs leading-4 text-[#4c3b24]">
                {choice.detail}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {selectedChoice?.paths.map((path) => (
          <article
            key={path.id}
            className="rounded-[3px] border border-obsidian/15 bg-ivory/18 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-xl font-bold leading-none">
                {path.name}
              </h3>
              <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]">
                <span className="rounded-[2px] border border-obsidian/20 bg-obsidian/10 px-2 py-1">
                  {path.payout}
                </span>
                <span
                  className={`rounded-[2px] border px-2 py-1 ${riskClassNameByRisk[path.risk]}`}
                >
                  {riskLabelByRisk[path.risk]}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-5 text-[#352a1b]">
              {path.followUp}
            </p>
          </article>
        ))}
      </div>
    </aside>
  );
}
