"use client";

import {
  MAX_INTOXICATION,
  intoxicationPenalty
} from "@shared/intoxication";
import { MAX_HEAT, MAX_STAMINA, type Player } from "@shared/player";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useFormatters } from "../../lib/useFormatters";
import { Button } from "../Button/Button";

type StreetStatusProps = {
  isBusy: boolean;
  onBribeHeat: () => void;
  player: Player;
  precinctQuote: { chunk: number; cost: number } | null;
};

const meterToneClasses = {
  brass: "bg-brass",
  danger: "bg-danger",
  profit: "bg-profit",
  teal: "bg-teal"
} as const;

function Meter({
  label,
  max,
  tone,
  value
}: {
  label: string;
  max: number;
  tone: keyof typeof meterToneClasses;
  value: number;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="min-w-36 flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`${displayText} text-lg text-muted`}>{label}</span>
        <span className={`${displayText} text-lg text-ink`}>
          {value} / {max}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-control border border-line bg-black/40">
        <div
          className={cx("h-full", meterToneClasses[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Stamina and heat at a glance, with the precinct payoff one click away. */
export function StreetStatus({
  isBusy,
  onBribeHeat,
  player,
  precinctQuote
}: StreetStatusProps) {
  const { moneyFormatter } = useFormatters();
  const t = useTranslations("street");
  const { drunk, heat, high, stamina } = player.resources;
  const impairment = intoxicationPenalty(high, drunk);
  const canBribe =
    precinctQuote !== null &&
    heat > 0 &&
    player.resources.cash >= precinctQuote.cost;

  return (
    <div className="flex flex-wrap items-end gap-6 rounded-panel border border-line bg-surface px-5 py-4 shadow-panel">
      <Meter
        label={t("stamina")}
        max={MAX_STAMINA}
        tone="brass"
        value={stamina}
      />
      <Meter label={t("heat")} max={MAX_HEAT} tone="danger" value={heat} />
      <Meter
        label={t("high")}
        max={MAX_INTOXICATION}
        tone="teal"
        value={high}
      />
      <Meter
        label={t("drunk")}
        max={MAX_INTOXICATION}
        tone="profit"
        value={drunk}
      />
      {impairment > 0 ? (
        <span
          className={`inline-flex items-center rounded-control border border-danger px-3 py-2 ${displayText} text-lg text-danger-strong`}
          title={t("impairedTip")}
        >
          {t("impaired", { penalty: impairment })}
        </span>
      ) : null}
      <div className="flex items-center gap-3">
        {precinctQuote ? (
          <p className={`m-0 ${typography.metadata}`}>
            {t("bribeQuote", {
              chunk: precinctQuote.chunk,
              cost: moneyFormatter.format(precinctQuote.cost)
            })}
          </p>
        ) : null}
        <Button
          disabled={isBusy || !canBribe}
          onClick={onBribeHeat}
          size="small"
          variant="secondary"
        >
          {t("payPrecinct")}
        </Button>
      </div>
    </div>
  );
}
