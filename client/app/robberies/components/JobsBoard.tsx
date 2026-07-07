import {
  cornerRegisterJob,
  jobBoardNotes,
  jobBoardStrings,
} from "../lib/jobsData";
import { JobPostIt } from "./JobPostIt";
import { JobStoryPanel } from "./JobStoryPanel";

export function JobsBoard() {
  return (
    <section
      aria-labelledby="jobs-board-title"
      className="mx-auto w-full max-w-[96rem]"
    >
      <div className="relative min-h-[78rem] overflow-hidden rounded-[4px] border border-line bg-[radial-gradient(circle_at_22%_18%,rgb(229_213_79_/_0.08),transparent_28%),radial-gradient(circle_at_82%_22%,rgb(116_31_24_/_0.16),transparent_32%),linear-gradient(135deg,#292316,#14130f_58%,#080806)] shadow-menu lg:h-[calc(100dvh-7rem)] lg:min-h-[50rem]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(240_234_219_/_0.035)_1px,transparent_1px),linear-gradient(180deg,rgb(240_234_219_/_0.028)_1px,transparent_1px)] bg-[size:32px_32px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-5 border border-line/50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgb(8_8_6_/_0.22)_63%,rgb(8_8_6_/_0.64)_100%)]"
        />

        <div aria-hidden="true">
          {jobBoardStrings.map((string) => (
            <span
              key={string.id}
              className={`absolute left-1/2 top-1/2 z-10 h-[2px] origin-left bg-blood/80 shadow-[0_0_8px_rgb(116_31_24_/_0.5)] ${string.className}`}
            />
          ))}
        </div>

        {jobBoardNotes.map((note) => (
          <JobPostIt key={note.id} note={note} />
        ))}

        <h1
          id="jobs-board-title"
          className="absolute left-1/2 top-1/2 z-30 flex h-[clamp(6rem,13vw,9.5rem)] w-[clamp(8rem,16vw,13rem)] -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] items-center justify-center rounded-[2px] border border-obsidian/25 bg-parchment text-center font-serif text-[clamp(2.4rem,5vw,4.8rem)] font-bold leading-none text-obsidian shadow-[0_18px_35px_rgb(0_0_0_/_0.35)]"
        >
          <span className="absolute left-1/2 top-0 h-4 w-14 -translate-x-1/2 -translate-y-1/2 rotate-[3deg] bg-ivory/45 shadow-[0_2px_5px_rgb(0_0_0_/_0.24)]" />
          Jobs
        </h1>

        <JobStoryPanel job={cornerRegisterJob} />
      </div>
    </section>
  );
}
