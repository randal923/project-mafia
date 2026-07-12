import type { MissionView, OutcomeTier } from "@shared/job";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import {
  MOMENTUM_TIER_ORDER,
  outcomeTierLabelKeys,
  tierForMomentum
} from "./MissionRunnerHelpers";

type MissionMomentumMeterProps = {
  momentum: NonNullable<MissionView["momentum"]>;
};

const zoneClasses: Record<OutcomeTier, string> = {
  disaster: "bg-danger-strong",
  failure: "bg-danger-strong/70",
  jackpot: "bg-brass",
  partial_failure: "bg-danger-strong/40",
  partially_successful: "bg-profit/40",
  successful: "bg-profit/75"
};

/**
 * Where the run stands: cumulative momentum mapped onto the six outcome
 * zones. Safe plays nudge the marker, bold plays throw it.
 */
export function MissionMomentumMeter({ momentum }: MissionMomentumMeterProps) {
  const t = useTranslations("mission");
  const { bands, current } = momentum;
  const pace = tierForMomentum(current, bands);

  return (
    <section
      aria-label={t("momentum.title")}
      className="rounded-panel border border-line bg-black/30 p-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className={`m-0 ${typography.metadata}`}>{t("momentum.title")}</p>
        <p className={`m-0 ${displayText} text-xl text-brass-bright`}>
          {current > 0 ? `+${current}` : current}
          <span className={`ml-2 ${typography.metadata}`}>
            {t("momentum.onPaceFor", {
              tier: t(`outcomeTiers.${outcomeTierLabelKeys[pace]}`)
            })}
          </span>
        </p>
      </div>
      <div className="mt-3 flex gap-1">
        {MOMENTUM_TIER_ORDER.map((tier) => (
          <div
            className={cx(
              "h-2 flex-1 rounded-full transition-all duration-300",
              zoneClasses[tier],
              tier === pace
                ? "h-3 -translate-y-0.5 ring-2 ring-brass-bright"
                : "opacity-50"
            )}
            key={tier}
            title={t(`outcomeTiers.${outcomeTierLabelKeys[tier]}`)}
          />
        ))}
      </div>
      <p className={`m-0 mt-2 ${typography.metadata}`}>
        {t("momentum.bandsSummary", {
          failureBelow: bands.failureAtLeast,
          jackpotAbove: bands.jackpotAbove,
          successAt: bands.successfulAtLeast
        })}
      </p>
    </section>
  );
}
