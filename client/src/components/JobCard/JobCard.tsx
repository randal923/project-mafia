import type { JobOffer } from "@shared/job";
import { displayText, typography } from "../../design-system/typography";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

type JobCardProps = {
  disabled?: boolean;
  offer: JobOffer;
  onAccept: (offerId: string) => void;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

export function JobCard({ disabled = false, offer, onAccept }: JobCardProps) {
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
      <dl className="m-0 flex items-center justify-between gap-3">
        <div>
          <dt className={typography.metadata}>Take</dt>
          <dd className={`m-0 ${displayText} text-xl text-profit`}>
            {moneyFormatter.format(offer.rewardMin)} –{" "}
            {moneyFormatter.format(offer.rewardMax)}
          </dd>
        </div>
        <div className="text-right">
          <dt className={typography.metadata}>Heat</dt>
          <dd className={`m-0 ${displayText} text-xl text-danger-strong`}>
            +{offer.heatIncrease}
          </dd>
        </div>
      </dl>
      <Button
        disabled={disabled}
        onClick={() => onAccept(offer.id)}
        size="small"
      >
        Take the job
      </Button>
    </article>
  );
}
