import type { JobOffer } from "@shared/job";
import type { PlayerItem } from "@shared/player";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

type JobCardProps = {
  disabled?: boolean;
  offer: JobOffer;
  onAccept: (offerId: string) => void;
  /** Current loadout + stash; powers the live gear checklist. */
  ownedItems?: readonly PlayerItem[];
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
  ownedItems,
  playerStamina
}: JobCardProps) {
  const t = useTranslations("jobCard");
  const { districtNameForLabel } = useCatalogText();
  const tooTired =
    offer.staminaCost !== undefined &&
    playerStamina !== undefined &&
    playerStamina < offer.staminaCost;
  const gear = offer.gear ?? [];

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line bg-surface-raised p-6">
      <div className="flex items-center justify-between gap-3">
        <Tag label={districtNameForLabel(offer.district)} />
        <p className={`m-0 ${typography.metadata}`}>
          {t("difficulty", { difficulty: offer.difficulty })}
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
          <p className={`m-0 ${typography.metadata}`}>{t("gearIntro")}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {gear.map((entry) => {
              const matchingItem = ownedItems
                ? [...ownedItems]
                    .filter(
                      (item) =>
                        (!item.consumable || (item.quantity ?? 1) > 0) &&
                        item.tags?.some((tag) => entry.tags.includes(tag)),
                    )
                    .sort(
                      (a, b) =>
                        (b.power ?? 0) - (a.power ?? 0) ||
                        a.id.localeCompare(b.id),
                    )[0]
                : undefined;
              const carried = ownedItems
                ? matchingItem !== undefined
                : undefined;
              const consumes = matchingItem?.consumable ?? entry.consumes;

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
                    consumes ? t("gearConsumable") : t("gearReusable")
                  }
                >
                  {carried === undefined ? "" : carried ? "✓ " : "✗ "}
                  {entry.label}
                  {consumes ? " ◦" : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <dl className="m-0 flex items-center justify-between gap-3">
        <div>
          <dt className={typography.metadata}>{t("take")}</dt>
          <dd className={`m-0 ${displayText} text-xl text-profit`}>
            {moneyFormatter.format(offer.rewardMin)} –{" "}
            {moneyFormatter.format(offer.rewardMax)}
          </dd>
        </div>
        {offer.staminaCost !== undefined ? (
          <div className="text-right">
            <dt className={typography.metadata}>{t("stamina")}</dt>
            <dd
              className={`m-0 ${displayText} text-xl ${tooTired ? "text-danger-strong" : "text-brass"}`}
            >
              −{offer.staminaCost}
            </dd>
          </div>
        ) : null}
        <div className="text-right">
          <dt className={typography.metadata}>{t("heat")}</dt>
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
        {tooTired ? t("tooTired") : t("takeJob")}
      </Button>
    </article>
  );
}
