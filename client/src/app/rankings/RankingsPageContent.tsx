"use client";

import { CONQUEST_HOLD_HOURS, type RespectStanding, type Season } from "@shared/season";
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
        <p className={typography.metadata}>Tallying respect…</p>
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
          {season.name}
        </p>
        <h1 className={`mt-1 mb-0 ${displayText} text-5xl text-title`}>
          Rankings
        </h1>
        <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
          Respect accrues from held turf (weighted by district), battles won,
          landmarks controlled, and jackpot jobs. Conquer every district
          stronghold and hold it {CONQUEST_HOLD_HOURS} hours to take the city
          outright — otherwise the most respected family wins when the season
          ends on{" "}
          {new Intl.DateTimeFormat("en-US", {
            day: "numeric",
            month: "long",
          }).format(Date.parse(season.endsAt))}
          .
        </p>
      </header>

      {countdown ? (
        <div className="rounded-panel border border-danger bg-danger/10 px-6 py-4">
          <p className={`m-0 ${displayText} text-xl text-danger-strong`}>
            CONQUEST COUNTDOWN — the {countdown.familyName} family holds all
            seven districts. About {Math.ceil(countdownHoursLeft ?? 0)} hours
            remain to break their grip.
          </p>
        </div>
      ) : null}

      <Table
        caption="Season standings"
        columns={[
          { align: "left", header: "#", id: "rank" },
          { align: "left", header: "Family", id: "family", isRowHeader: true },
          { align: "right", header: "Blocks", id: "turf" },
          { align: "right", header: "Landmarks", id: "landmarks" },
          { align: "right", header: "Respect", id: "respect" },
        ]}
        description="Every family with a name in the city, most respected first."
        emptyMessage="Nobody has planted a flag yet. The city waits."
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
                  {standing.familyName}
                  {player && standing.uid === player.id ? " (you)" : ""}
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
