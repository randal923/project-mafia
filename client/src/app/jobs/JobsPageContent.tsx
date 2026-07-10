"use client";

import { JobCard } from "../../components/JobCard/JobCard";
import { MissionRunner } from "../../components/MissionRunner/MissionRunner";
import { Button } from "../../components/Button/Button";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { typography } from "../../design-system/typography";
import { useJobBoard } from "./hooks/useJobBoard";
import { useMission } from "./hooks/useMission";

export function JobsPageContent() {
  const { status: playerStatus } = usePlayer();
  const board = useJobBoard();
  const mission = useMission();

  if (
    playerStatus === "loading" ||
    playerStatus === "missing" ||
    mission.status === "loading"
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Checking the streets…</p>
      </div>
    );
  }

  if (playerStatus === "error" || mission.status === "error") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>
          Could not reach your contacts. Refresh to try again.
        </p>
      </div>
    );
  }

  if (mission.mission) {
    return (
      <MissionRunner
        isChoosing={mission.isChoosing}
        mission={mission.mission}
        onChoose={(choiceId) => void mission.choose(choiceId)}
        onFinish={() => {
          mission.clearMission();
          void board.reload();
        }}
      />
    );
  }

  const handleAccept = async (offerId: string) => {
    const view = await board.accept(offerId);
    if (view) {
      mission.startMission(view);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className={`m-0 ${typography.panelHeading}`}>Jobs</h1>
          <p className={`m-0 ${typography.paragraph}`}>
            Word on the street. Pick a contract and see it through.
          </p>
        </div>
        <Button
          disabled={board.isBusy}
          onClick={() => void board.regenerate()}
          size="small"
          variant="secondary"
        >
          Ask around again
        </Button>
      </div>
      {board.status === "loading" ? (
        <p className={typography.metadata}>Listening for rumors…</p>
      ) : board.status === "error" || !board.board ? (
        <p className={typography.metadata}>
          The board is quiet. Refresh to try again.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {board.board.offers.map((offer) => (
            <JobCard
              disabled={board.isBusy}
              key={offer.id}
              offer={offer}
              onAccept={(offerId) => void handleAccept(offerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
