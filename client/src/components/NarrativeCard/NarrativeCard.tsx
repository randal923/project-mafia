import type { ReactNode } from "react";
import { Tag } from "../Tag/Tag";

type NarrativePriority = "standard" | "urgent";

type NarrativeCardProps = {
  action?: ReactNode;
  children: ReactNode;
  district: string;
  kicker: string;
  priority?: NarrativePriority;
  timeLabel: string;
  title: string;
};

const priorityClasses: Record<NarrativePriority, string> = {
  standard: "border-t-brass",
  urgent: "border-t-danger-strong"
};

export function NarrativeCard({
  action,
  children,
  district,
  kicker,
  priority = "standard",
  timeLabel,
  title
}: NarrativeCardProps) {
  return (
    <article
      className={`min-h-88 rounded-panel border border-t-2 border-line bg-surface-raised p-6 ${priorityClasses[priority]}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="m-0 font-display text-2xl uppercase leading-none tracking-normal text-brass">
          {kicker}
        </p>
        <p className="m-0 text-sm font-medium text-faint">{timeLabel}</p>
      </div>
      <h2 className="mt-6 mb-5 max-w-3xl font-display text-4xl uppercase leading-none tracking-normal text-title md:text-5xl">
        {title}
      </h2>
      <div className="mb-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="h-3 w-3 rotate-45 border border-line" />
        <span className="h-px flex-1 bg-line" />
      </div>
      <Tag label={district} />
      <div className="mt-8 max-w-3xl text-xl leading-relaxed text-muted">
        {children}
      </div>
      {action ? <div className="mt-8 flex justify-end">{action}</div> : null}
    </article>
  );
}
