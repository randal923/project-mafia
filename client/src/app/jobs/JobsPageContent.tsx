"use client";

import { crewJobCapacity, type CrewMember } from "@shared/crew";
import type { PrisonAttemptResult, PrisonStatus } from "@shared/prison";
import type { PlayerItem } from "@shared/player";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { CrewPicker } from "../../components/Crew/CrewPicker";
import { JobCard } from "../../components/JobCard/JobCard";
import { MissionRunner } from "../../components/MissionRunner/MissionRunner";
import { PrisonPanel } from "../../components/PrisonPanel/PrisonPanel";
import { StreetStatus } from "../../components/StreetStatus/StreetStatus";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { typography } from "../../design-system/typography";
import {
  ApiError,
  bribeHeat,
  bribePrisonGuard,
  escapePrison,
  fetchCrewRoster,
  fetchMyPlayer,
  fetchPrecinctQuote,
  fetchPrisonStatus
} from "../../lib/api";
import { useJobBoard } from "./hooks/useJobBoard";
import { useMission } from "./hooks/useMission";

export function JobsPageContent() {
  const { user } = useAuth();
  const { player, setPlayer, status: playerStatus } = usePlayer();
  const board = useJobBoard();
  const mission = useMission();
  const [prisonStatus, setPrisonStatus] = useState<PrisonStatus | null>(null);
  const [precinctQuote, setPrecinctQuote] = useState<{
    chunk: number;
    cost: number;
  } | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [idleCrew, setIdleCrew] = useState<CrewMember[]>([]);
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const imprisoned = Boolean(player?.prison);
  const activePrisonStatus =
    player?.prison &&
    prisonStatus?.prison.sentencedAt === player.prison.sentencedAt
      ? prisonStatus
      : null;

  // Equipment the player owns right now — keeps the gear checklists on job
  // cards live as they shop, without waiting for a board rebuild.
  const ownedItems = useMemo(() => {
    if (!player) {
      return [];
    }
    return [...Object.values(player.loadout), ...player.stash].filter(
      (item): item is PlayerItem => item !== undefined,
    );
  }, [player]);

  useEffect(() => {
    if (!user || !imprisoned) {
      return;
    }

    let isCancelled = false;
    fetchPrisonStatus(user)
      .then((status) => {
        if (!isCancelled) setPrisonStatus(status);
      })
      .catch((error: unknown) => {
        console.error("Failed to load prison status:", error);
      });
    return () => {
      isCancelled = true;
    };
  }, [user, imprisoned, player?.prison?.releaseAt]);

  // Idle soldiers can ride along on jobs for check bonuses.
  useEffect(() => {
    if (!user || imprisoned) {
      return;
    }

    let isCancelled = false;
    fetchCrewRoster(user)
      .then((result) => {
        if (!isCancelled) {
          setIdleCrew(result.crew.filter((member) => member.status === "idle"));
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [user, imprisoned, mission.mission]);

  useEffect(() => {
    if (!user || imprisoned) {
      return;
    }

    let isCancelled = false;
    fetchPrecinctQuote(user)
      .then((quote) => {
        if (!isCancelled) setPrecinctQuote(quote);
      })
      .catch((error: unknown) => {
        console.error("Failed to load precinct quote:", error);
      });
    return () => {
      isCancelled = true;
    };
  }, [user, imprisoned, player?.progression.level]);

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

  if (playerStatus === "error" || mission.status === "error" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>
          Could not reach your contacts. Refresh to try again.
        </p>
      </div>
    );
  }

  const runPrisonAction = async (
    action: () => Promise<PrisonAttemptResult>,
    successMessage: string,
    failureMessage: string
  ) => {
    if (!user || isActing) return;
    setIsActing(true);
    try {
      const result = await action();
      setPlayer(result.player);
      setActionMessage(result.succeeded ? successMessage : failureMessage);
      if (!result.succeeded) {
        setPrisonStatus(await fetchPrisonStatus(user));
      }
    } catch (error) {
      setActionMessage(
        error instanceof ApiError ? error.message : "That didn't work. Try again."
      );
    } finally {
      setIsActing(false);
    }
  };

  if (imprisoned && activePrisonStatus) {
    return (
      <PrisonPanel
        isBusy={isActing}
        message={actionMessage}
        onBribe={() =>
          void runPrisonAction(
            () => bribePrisonGuard(user!),
            "The guard pockets the envelope and forgets to lock a door. You walk.",
            "He takes the money and calls it a donation. You're still here."
          )
        }
        onEscape={() =>
          void runPrisonAction(
            () => escapePrison(user!),
            "Over the wall and gone — but the whole city is looking for you now.",
            "A spotlight, a whistle, and a longer sentence."
          )
        }
        onServed={() => {
          if (user) {
            void fetchMyPlayer(user).then(setPlayer).catch(() => undefined);
          }
        }}
        status={activePrisonStatus}
      />
    );
  }

  if (imprisoned) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Checking in with the warden…</p>
      </div>
    );
  }

  if (mission.mission) {
    return (
      <MissionRunner
        healingError={mission.healingError}
        healingItemId={mission.healingItemId}
        healingItems={player.stash.filter((item) => Boolean(item.use?.health))}
        health={player.resources.health}
        healthUpdatedAt={player.updatedAt}
        isChoosing={mission.isChoosing || mission.healingItemId !== null}
        mission={mission.mission}
        onChoose={(choiceId) => void mission.choose(choiceId)}
        onFinish={() => {
          mission.clearMission();
          void board.reload();
          if (user) {
            void fetchMyPlayer(user).then(setPlayer).catch(() => undefined);
          }
        }}
        onHeal={(itemId) => void mission.heal(itemId)}
      />
    );
  }

  const acceptWithCrew = async (offerId: string, crewIds: string[]) => {
    setPendingOfferId(null);
    const view = await board.accept(offerId, crewIds);
    if (view) {
      mission.startMission(view);
      if (user) {
        void fetchMyPlayer(user).then(setPlayer).catch(() => undefined);
      }
    }
  };

  const handleAccept = async (offerId: string) => {
    // With idle soldiers available, offer to bring some along first.
    if (idleCrew.length > 0) {
      setPendingOfferId(offerId);
      return;
    }
    await acceptWithCrew(offerId, []);
  };

  const handleBribeHeat = async () => {
    if (!user || isActing) return;
    setIsActing(true);
    try {
      setPlayer(await bribeHeat(user));
    } catch (error) {
      console.error("Precinct bribe failed:", error);
    } finally {
      setIsActing(false);
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
      <StreetStatus
        isBusy={isActing}
        onBribeHeat={() => void handleBribeHeat()}
        player={player}
        precinctQuote={precinctQuote}
      />
      {pendingOfferId ? (
        <CrewPicker
          capacity={crewJobCapacity(player.progression.skills.leadership)}
          confirmLabel="Take the job"
          crew={idleCrew}
          intro="Each soldier boosts checks that lean on his specialty. On a disaster, they share the consequences — and their gear is on the line."
          isBusy={board.isBusy}
          onCancel={() => setPendingOfferId(null)}
          onConfirm={(crewIds) => void acceptWithCrew(pendingOfferId, crewIds)}
          title="Who rides along?"
        />
      ) : null}
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
              ownedItems={ownedItems}
              playerStamina={player.resources.stamina}
            />
          ))}
        </div>
      )}
    </div>
  );
}
