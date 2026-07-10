import { MAX_HEALTH, recoveredHealth } from "@shared/health";
import type { PlayerItem } from "@shared/player";
import { useEffect, useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Button } from "../Button/Button";

type MissionHealthPanelProps = {
  canHeal: boolean;
  errorMessage: string | null;
  healingItemId: string | null;
  health: number;
  healthUpdatedAt: string;
  isBusy: boolean;
  items: PlayerItem[];
  onHeal: (itemId: string) => void;
};

export function MissionHealthPanel({
  canHeal,
  errorMessage,
  healingItemId,
  health,
  healthUpdatedAt,
  isBusy,
  items,
  onHeal,
}: MissionHealthPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const liveHealth = recoveredHealth(
    health,
    healthUpdatedAt,
    new Date(now).toISOString(),
  );
  const full = liveHealth >= MAX_HEALTH;

  return (
    <section
      aria-label="Live health and healing"
      aria-live="polite"
      className="rounded-panel border border-line bg-black/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`m-0 ${typography.metadata}`}>Live Health</p>
          <p className={`m-0 ${displayText} text-2xl text-teal`}>
            {liveHealth} / {MAX_HEALTH}
          </p>
        </div>
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-control bg-black/50">
          <div
            aria-hidden="true"
            className="h-full bg-teal"
            style={{ width: `${Math.max(1, Math.min(100, liveHealth))}%` }}
          />
        </div>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <Button
              disabled={!canHeal || full || isBusy || healingItemId !== null}
              key={item.id}
              onClick={() => onHeal(item.id)}
              size="small"
              variant="secondary"
            >
              {healingItemId === item.id
                ? "Using…"
                : `${item.name} +${item.use?.health ?? 0} (${item.quantity ?? 1})`}
            </Button>
          ))}
        </div>
      ) : liveHealth < MAX_HEALTH ? (
        <p className={`m-0 mt-2 ${typography.metadata}`}>
          No healing kits in your stash.
        </p>
      ) : null}
      {!canHeal && liveHealth < MAX_HEALTH ? (
        <p className={`m-0 mt-2 ${typography.metadata}`}>
          Healing opens after your first choice and closes when the job ends.
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className={`m-0 mt-2 ${typography.metadata} text-danger-strong`}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
