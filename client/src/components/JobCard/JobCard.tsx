import type { JobOffer } from "@shared/job";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

type JobCardProps = {
  disabled?: boolean;
  offer: JobOffer;
  onAccept: (offerId: string) => void;
  /** Tags the player owns (loadout + stash); powers the gear checklist. */
  ownedTags?: ReadonlySet<string>;
  /** When provided, the card blocks jobs the player is too tired for. */
  playerStamina?: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

export function JobCard({
  disabled = false,
  offer,
  onAccept,
  ownedTags,
  playerStamina
}: JobCardProps) {
  const tooTired =
    offer.staminaCost !== undefined &&
    playerStamina !== undefined &&
    playerStamina < offer.staminaCost;
  const gear = offer.gear ?? [];

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line bg-surface-raised p-6">
      <div className="flex items-center justify-between gap-3">
        <Tag label={offer.district} />
        <p className={`m-0 ${typography.metadata}`}>
          Difficulty {offer.difficulty} / 100
        </p>
      </div>
      <h3 className={`m-0 ${displayText} text-2xl text-title`}>
        {offer.storySeed.location}
      </h3>
      <p className={`m-0 flex-1 ${typography.narrativeParagraph}`}>
        {offer.storySeed.premise}
      </p>
      {gear.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={`m-0 ${typography.metadata}`}>
            Gear this job may call for — going without makes it harder:
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {gear.map((entry) => {
              const carried = ownedTags
                ? entry.tags.some((tag) => ownedTags.has(tag))
                : undefined;

              return (
                <li
                  className={cx(
                    "inline-flex items-center gap-1 rounded-control border px-2 py-1 text-sm font-medium leading-none",
                    carried === undefined
                      ? "border-line text-muted"
                      : carried
                        ? "border-profit/60 text-profit"
                        : "border-danger/60 text-danger-strong"
                  )}
                  key={entry.label}
                  title={
                    entry.consumes
                      ? "Consumable — one gets used up per demand on the run."
                      : "Reusable tool — carrying one covers the whole run."
                  }
                >
                  {carried === undefined ? "" : carried ? "✓ " : "✗ "}
                  {entry.label}
                  {entry.consumes ? " ◦" : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <dl className="m-0 flex items-center justify-between gap-3">
        <div>
          <dt className={typography.metadata}>Take</dt>
          <dd className={`m-0 ${displayText} text-xl text-profit`}>
            {moneyFormatter.format(offer.rewardMin)} –{" "}
            {moneyFormatter.format(offer.rewardMax)}
          </dd>
        </div>
        {offer.staminaCost !== undefined ? (
          <div className="text-right">
            <dt className={typography.metadata}>Stamina</dt>
            <dd
              className={`m-0 ${displayText} text-xl ${tooTired ? "text-danger-strong" : "text-brass"}`}
            >
              −{offer.staminaCost}
            </dd>
          </div>
        ) : null}
        <div className="text-right">
          <dt className={typography.metadata}>Heat</dt>
          <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
            +{offer.heatIncrease}
          </dd>
        </div>
      </dl>
      <Button
        disabled={disabled || tooTired}
        onClick={() => onAccept(offer.id)}
        size="small"
      >
        {tooTired ? "Too tired" : "Take the job"}
      </Button>
    </article>
  );
}
