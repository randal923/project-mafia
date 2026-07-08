"use client";

import type { Player } from "@shared/player";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { ApiError, fetchMyPlayer } from "../../lib/api";
import { useAuth } from "../AuthProvider/AuthProvider";

export type PlayerStatus = "error" | "loading" | "missing" | "ready";

type PlayerContextValue = {
  player: Player | null;
  setPlayer: (player: Player) => void;
  status: PlayerStatus;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

type PlayerProviderProps = {
  children: ReactNode;
};

export function PlayerProvider({ children }: PlayerProviderProps) {
  const { user } = useAuth();
  const [player, setPlayerState] = useState<Player | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [prevUser, setPrevUser] = useState(user);

  if (prevUser !== user) {
    setPrevUser(user);
    setPlayerState(null);
    setStatus("loading");
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    fetchMyPlayer(user)
      .then((nextPlayer) => {
        if (isCancelled) {
          return;
        }
        setPlayerState(nextPlayer);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setStatus("missing");
          return;
        }
        console.error("Failed to load player:", error);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      player,
      setPlayer: (nextPlayer: Player) => {
        setPlayerState(nextPlayer);
        setStatus("ready");
      },
      status
    }),
    [player, status]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }

  return context;
}
