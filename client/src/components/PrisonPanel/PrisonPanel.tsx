"use client";

import type { PrisonStatus } from "@shared/prison";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Button } from "../Button/Button";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { useFormatters } from "../../lib/useFormatters";

type PrisonPanelProps = {
  isBusy: boolean;
  message: string | null;
  onBribe: () => void;
  onEscape: () => void;
  onServed: () => void;
  status: PrisonStatus;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function PrisonPanel({
  isBusy,
  message,
  onBribe,
  onEscape,
  onServed,
  status
}: PrisonPanelProps) {
  const t = useTranslations("prison");
  const locale = useLocale();
  const { moneyFormatter } = useFormatters();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const releaseMs = Date.parse(status.prison.releaseAt) - now;
  const cooldownMs = status.attemptCooldownUntil
    ? Date.parse(status.attemptCooldownUntil) - now
    : 0;
  const onCooldown = cooldownMs > 0;
  const language = locale === "pt-BR" ? "pt-BR" : "en";
  const reason =
    (status.prison.reasonLanguage ?? "en") === language
      ? status.prison.reason
      : t("reason");

  useEffect(() => {
    if (releaseMs <= 0) {
      onServed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseMs <= 0]);

  return (
    <section className="mx-auto w-full max-w-2xl rounded-panel border border-danger bg-surface p-8 shadow-panel">
      <p className={`m-0 ${displayText} text-xl text-danger-strong`}>
        {t("eyebrow")}
      </p>
      <h1 className={`mt-2 mb-0 ${displayText} text-5xl text-title`}>
        {t("title")}
      </h1>
      <p className={`mt-3 mb-0 ${typography.narrativeBody}`}>
        {reason} {t("flavor")}
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <span className={typography.metadata}>{t("releaseIn")}</span>
        <span className={`${displayText} text-4xl text-brass-bright`}>
          {formatRemaining(releaseMs)}
        </span>
        <span className={typography.metadata}>{t("serveNote")}</span>
      </div>

      <OrnamentDivider className="my-6" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-raised p-4">
          <p className={`m-0 ${displayText} text-2xl text-title`}>
            {t("bribe.title")}
          </p>
          <p className={`m-0 flex-1 ${typography.narrativeCaption}`}>
            {t("bribe.body", {
              chance: status.bribeChance,
              cost: moneyFormatter.format(status.bribeCost)
            })}
          </p>
          <Button
            disabled={isBusy || onCooldown}
            onClick={onBribe}
            size="small"
          >
            {t("bribe.action")}
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-raised p-4">
          <p className={`m-0 ${displayText} text-2xl text-title`}>
            {t("escape.title")}
          </p>
          <p className={`m-0 flex-1 ${typography.narrativeCaption}`}>
            {t("escape.body", { chance: status.escapeChance })}
          </p>
          <Button
            disabled={isBusy || onCooldown}
            onClick={onEscape}
            size="small"
            variant="danger"
          >
            {t("escape.action")}
          </Button>
        </div>
      </div>

      {onCooldown ? (
        <p className={`mt-4 mb-0 ${typography.metadata}`}>
          {t("cooldown", { time: formatRemaining(cooldownMs) })}
        </p>
      ) : null}
      {message ? (
        <p className={`mt-4 mb-0 ${typography.leadBody}`}>{message}</p>
      ) : null}
    </section>
  );
}
