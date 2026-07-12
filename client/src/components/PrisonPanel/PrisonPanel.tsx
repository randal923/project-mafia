"use client";

import type { PrisonStatus } from "@shared/prison";
import { useEffect, useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Button } from "../Button/Button";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";

type PrisonPanelProps = {
  isBusy: boolean;
  message: string | null;
  onBribe: () => void;
  onEscape: () => void;
  onServed: () => void;
  status: PrisonStatus;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

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

  useEffect(() => {
    if (releaseMs <= 0) {
      onServed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseMs <= 0]);

  return (
    <section className="mx-auto w-full max-w-2xl rounded-panel border border-danger bg-surface p-8 shadow-panel">
      <p className={`m-0 ${displayText} text-xl text-danger-strong`}>
        County lockup
      </p>
      <h1 className={`mt-2 mb-0 ${displayText} text-5xl text-title`}>
        You’re doing time
      </h1>
      <p className={`mt-3 mb-0 ${typography.narrativeBody}`}>
        {status.prison.reason} The cell is cold, the coffee is worse, and the
        city is getting along fine without you.
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <span className={typography.metadata}>Release in</span>
        <span className={`${displayText} text-4xl text-brass-bright`}>
          {formatRemaining(releaseMs)}
        </span>
        <span className={typography.metadata}>
          — serving the full stretch also cools your heat
        </span>
      </div>

      <OrnamentDivider className="my-6" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-raised p-4">
          <p className={`m-0 ${displayText} text-2xl text-title`}>
            Bribe a guard
          </p>
          <p className={`m-0 flex-1 ${typography.narrativeCaption}`}>
            {moneyFormatter.format(status.bribeCost)} changes hands whether he
            bites or not. Your charisma does the talking —{" "}
            {status.bribeChance}% odds.
          </p>
          <Button
            disabled={isBusy || onCooldown}
            onClick={onBribe}
            size="small"
          >
            Slip the envelope
          </Button>
        </div>
        <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-raised p-4">
          <p className={`m-0 ${displayText} text-2xl text-title`}>Break out</p>
          <p className={`m-0 flex-1 ${typography.narrativeCaption}`}>
            Stealth carries you over the wall — {status.escapeChance}% odds.
            Fail and the sentence grows; succeed and the manhunt adds heat.
          </p>
          <Button
            disabled={isBusy || onCooldown}
            onClick={onEscape}
            size="small"
            variant="danger"
          >
            Go over the wall
          </Button>
        </div>
      </div>

      {onCooldown ? (
        <p className={`mt-4 mb-0 ${typography.metadata}`}>
          The guards are watching you too closely. Next attempt in{" "}
          {formatRemaining(cooldownMs)}.
        </p>
      ) : null}
      {message ? (
        <p className={`mt-4 mb-0 ${typography.leadBody}`}>{message}</p>
      ) : null}
    </section>
  );
}
