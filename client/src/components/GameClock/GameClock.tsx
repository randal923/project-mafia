"use client";

import { gameTime, type GameTime } from "@shared/gameTime";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { displayText } from "../../design-system/typography";
import { usePlayer } from "../PlayerProvider/PlayerProvider";

/**
 * The city clock: one in-game day per real hour (shared/gameTime.ts),
 * anchored to the player's creation — every career starts on Day 1 at
 * 00:00. Rendered client-only after mount so SSR never disagrees with
 * the browser about the time.
 */
export function GameClock() {
  const t = useTranslations("clock");
  const { player } = usePlayer();
  const [time, setTime] = useState<GameTime | null>(null);
  const createdAt = player?.createdAt;

  useEffect(() => {
    if (!createdAt) {
      return;
    }

    const epochMs = Date.parse(createdAt);
    const tick = () => setTime(gameTime(Date.now(), epochMs));
    tick();
    // One game minute passes every 2.5 real seconds.
    const timer = setInterval(tick, 2_500);
    return () => clearInterval(timer);
  }, [createdAt]);

  return (
    <span
      className={`inline-flex min-h-10 items-center rounded-control border border-line px-3 ${displayText} text-lg text-brass`}
      suppressHydrationWarning
      title={t("tooltip")}
    >
      {createdAt && time
        ? t("label", {
            day: time.day,
            hour: String(time.hour).padStart(2, "0"),
            minute: String(time.minute).padStart(2, "0"),
          })
        : "—"}
    </span>
  );
}
