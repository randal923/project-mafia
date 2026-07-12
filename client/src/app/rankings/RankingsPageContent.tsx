"use client";

import { CONQUEST_HOLD_HOURS, type RespectStanding, type Season } from "@shared/season";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { Table } from "../../components/Table/Table";
import { displayText, typography } from "../../design-system/typography";
import { fetchRankings } from "../../lib/api";

export function RankingsPageContent() {
  const { user } = useAuth();
  const { player } = usePlayer();
  const [season, setSeason] = useState<Season | null>(null);
  const [standings, setStandings] = useState<RespectStanding[] | null>(null);
  const [now] = useState(() => Date.now());
  const t = useTranslations("rankings");
  const tSeason = useTranslations("season");
  const locale = useLocale();

  useEffect(() => {
    if (!user) {
      return;
    }
    let isCancelled = false;
    fetchRankings(user)
      .then((result) => {
        if (!isCancelled) {
          setSeason(result.season);
          setStandings(result.standings);
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [user]);

  if (!standings || !season) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>{t("loading")}</p>
      </div>
    );
  }

  const countdown = season.strongholdCountdown;
  const countdownHoursLeft = countdown
    ? Math.max(
        0,
        CONQUEST_HOLD_HOURS -
          (now - Date.parse(countdown.startedAt)) / 3_600_000,
      )
    : null;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="rounded-panel border border-line bg-surface px-6 py-5 shadow-panel">
        <p className={`m-0 ${displayText} text-xl text-faint`}>
          {tSeason("name", { number: season.number })}
        </p>
        <h1 className={`mt-1 mb-0 ${displayText} text-5xl text-title`}>
          {t("title")}
        </h1>
        <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
          {t("description", {
            date: new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "long",
            }).format(Date.parse(season.endsAt)),
            hours: CONQUEST_HOLD_HOURS,
          })}
        </p>
      </header>

      {countdown ? (
        <div className="rounded-panel border border-danger bg-danger/10 px-6 py-4">
          <p className={`m-0 ${displayText} text-xl text-danger-strong`}>
            {t("countdown", {
              family: countdown.familyName || t("unknownFamily"),
              hours: Math.ceil(countdownHoursLeft ?? 0),
            })}
          </p>
        </div>
      ) : null}

      <Table
        caption={t("table.caption")}
        columns={[
          { align: "left", header: "#", id: "rank" },
          {
            align: "left",
            header: t("table.family"),
            id: "family",
            isRowHeader: true,
          },
          { align: "right", header: t("table.blocks"), id: "turf" },
          { align: "right", header: t("table.landmarks"), id: "landmarks" },
          { align: "right", header: t("table.respect"), id: "respect" },
        ]}
        description={t("table.description")}
        emptyMessage={t("table.empty")}
        rows={standings.map((standing, index) => ({
          cells: [
            { value: String(index + 1) },
            {
              value: (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: standing.familyColor }}
                  />
                  {standing.familyName || t("unknownFamily")}
                  {player && standing.uid === player.id
                    ? ` ${t("you")}`
                    : ""}
                </span>
              ),
            },
            { value: String(standing.turfCount ?? 0) },
            { value: String(standing.landmarkCount ?? 0) },
            { tone: "profit", value: String(standing.respect) },
          ],
          id: standing.uid,
        }))}
      />
    </div>
  );
}
