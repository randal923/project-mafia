"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../auth/useAuth";
import type { Player } from "../models/player";
import { PlayerService } from "../services/player";

type PlayerRecord = {
  player: Player;
  userId: string;
};

type PlayerError = {
  message: string;
  userId: string;
};

type UsePlayerResult = {
  currentFormError: string | null;
  currentLoadError: string | null;
  isSaving: boolean;
  isSignedIn: boolean;
  nickname: string;
  player: Player | null;
  saveNickname: () => Promise<void>;
  setNickname: (nickname: string) => void;
};

const PlayerContext = createContext<UsePlayerResult | null>(null);

export function PlayerProvider({ children }: PropsWithChildren) {
  const playerState = usePlayerState();

  return (
    <PlayerContext.Provider value={playerState}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): UsePlayerResult {
  const playerState = useContext(PlayerContext);

  if (!playerState) {
    throw new Error("usePlayer must be used within PlayerProvider.");
  }

  return playerState;
}

function usePlayerState(): UsePlayerResult {
  const { user } = useAuth();
  const [playerRecord, setPlayerRecord] = useState<PlayerRecord | null>(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [formError, setFormError] = useState<PlayerError | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<PlayerError | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    const loadPlayer = async () => {
      const playerResult = await PlayerService.getPlayer(user);

      if (isCancelled) {
        return;
      }

      if (!playerResult.ok) {
        setLoadError({
          message: playerResult.error.message,
          userId: user.uid,
        });
        return;
      }

      setFormError(null);
      setLoadError(null);
      setNickname(playerResult.player.nickname);
      setPlayerRecord({
        player: playerResult.player,
        userId: user.uid,
      });
    };

    void loadPlayer();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const currentFormError =
    formError && formError.userId === user?.uid ? formError.message : null;
  const currentLoadError =
    loadError && loadError.userId === user?.uid ? loadError.message : null;
  const player =
    playerRecord && playerRecord.userId === user?.uid
      ? playerRecord.player
      : null;

  const saveNickname = async () => {
    if (!user) {
      return;
    }

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setFormError({
        message: "Nickname is required.",
        userId: user.uid,
      });
      return;
    }

    setFormError(null);
    setIsSaving(true);

    const playerResult = await PlayerService.saveNickname(
      user,
      trimmedNickname,
    );

    if (!playerResult.ok) {
      setFormError({
        message: playerResult.error.message,
        userId: user.uid,
      });
      setIsSaving(false);
      return;
    }

    setPlayerRecord({
      player: playerResult.player,
      userId: user.uid,
    });
    setNickname(playerResult.player.nickname);
    setIsSaving(false);
  };

  return {
    currentFormError,
    currentLoadError,
    isSaving,
    isSignedIn: Boolean(user),
    nickname,
    player,
    saveNickname,
    setNickname,
  };
}
