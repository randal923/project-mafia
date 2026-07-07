import Image from "next/image";
import type { JobBoardNote } from "../lib/jobTypes";

type JobPostItProps = {
  note: JobBoardNote;
};

export function JobPostIt({ note }: JobPostItProps) {
  const className = `absolute z-20 flex flex-col overflow-hidden rounded-[2px] border border-obsidian/25 shadow-[0_18px_35px_rgb(0_0_0_/_0.28)] ${note.sizeClassName} ${note.positionClassName} ${note.rotateClassName} ${note.paperClassName}`;

  if (!note.job) {
    return (
      <div aria-hidden="true" className={className}>
        <span className="absolute left-1/2 top-0 h-3 w-10 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-ivory/40 shadow-[0_2px_5px_rgb(0_0_0_/_0.22)]" />
        <div className="m-3 flex-1 border border-obsidian/10 bg-ivory/10" />
      </div>
    );
  }

  return (
    <article aria-label={`${note.job.name} job`} className={`${className} p-3`}>
      <span className="absolute left-1/2 top-0 h-3 w-12 -translate-x-1/2 -translate-y-1/2 rotate-[2deg] bg-ivory/45 shadow-[0_2px_5px_rgb(0_0_0_/_0.24)]" />
      <div className="relative mb-3 h-[clamp(7rem,12vw,9.25rem)] overflow-hidden border border-obsidian/25 bg-obsidian/15">
        <Image
          src={note.job.imageSrc}
          alt={note.job.imageAlt}
          fill
          sizes="(max-width: 640px) 13rem, 17rem"
          className="object-cover"
        />
      </div>
      <h2 className="font-serif text-2xl font-bold leading-none text-obsidian">
        {note.job.name}
      </h2>
      <p className="mt-2 text-sm leading-5 text-[#352a1b]">
        {note.job.description}
      </p>
    </article>
  );
}
