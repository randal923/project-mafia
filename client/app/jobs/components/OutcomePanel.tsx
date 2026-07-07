import type { JobStoryOutcome } from "../../models/job";
import { formatOutcome } from "../lib/formatOutcome";
import { formatSignedMoney } from "../lib/formatSignedMoney";
import { JobStat } from "./JobStat";

type OutcomePanelProps = {
  outcome: JobStoryOutcome;
};

export function OutcomePanel({ outcome }: OutcomePanelProps) {
  return (
    <section className="border border-line bg-obsidian/50 p-4">
      <p className="text-xs uppercase tracking-widest text-ash">
        {formatOutcome(outcome.outcome)}
      </p>
      <h2 className="mt-1 font-serif text-2xl font-bold uppercase tracking-widest text-ivory">
        {outcome.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-parchment">
        {outcome.narration}
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <JobStat label="Money" value={formatSignedMoney(outcome.moneyChange)} />
        <JobStat label="Heat" value={`+${outcome.heatChange}`} />
        <JobStat label="Respect" value={outcome.factionRespectChange} />
      </dl>

      {outcome.wound ? (
        <p className="mt-4 border border-blood bg-blood/20 px-3 py-2 text-sm text-ivory">
          {outcome.wound}
        </p>
      ) : null}

      {outcome.foundItem ? (
        <p className="mt-4 border border-line bg-smoke/70 px-3 py-2 text-sm leading-6 text-ivory">
          {outcome.foundItem.name}: ${outcome.foundItem.estimatedValue}.{" "}
          {outcome.foundItem.consequence}
        </p>
      ) : null}
    </section>
  );
}
