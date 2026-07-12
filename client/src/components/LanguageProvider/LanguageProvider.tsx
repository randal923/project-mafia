"use client";

import {
  isPlayerLanguage,
  PLAYER_LANGUAGE_COOKIE,
  type PlayerLanguage,
} from "@shared/language";
import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { updatePlayerLanguage } from "../../lib/api";
import en from "../../messages/en.json";
import ptBR from "../../messages/pt-BR.json";
import { useAuth } from "../AuthProvider/AuthProvider";
import { usePlayer } from "../PlayerProvider/PlayerProvider";

const COOKIE_MAX_AGE_SECONDS = 31_536_000;
const LEGACY_LANGUAGE_STORAGE_KEY = "project-mafia.language";

const messagesByLanguage: Record<PlayerLanguage, typeof en> = {
  en,
  "pt-BR": ptBR,
};

function persistBrowserLanguage(language: PlayerLanguage): void {
  document.cookie = `${PLAYER_LANGUAGE_COOKIE}=${language}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  document.documentElement.lang = language;
}

type LanguageContextValue = {
  language: PlayerLanguage;
  setLanguage: (language: PlayerLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
  initialLanguage: PlayerLanguage;
};

export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  const { user } = useAuth();
  const { player, setPlayer } = usePlayer();
  const [selectedLanguage, setSelectedLanguage] =
    useState<PlayerLanguage>(initialLanguage);
  const latestLanguageRequest = useRef(0);
  const languageUpdateQueue = useRef<Promise<void>>(Promise.resolve());
  const language = user && player?.language ? player.language : selectedLanguage;

  const persistPlayerLanguage = useCallback(
    (next: PlayerLanguage, previousPlayer?: typeof player) => {
      if (!user) {
        return;
      }

      const requestId = ++latestLanguageRequest.current;
      const request = languageUpdateQueue.current.then(() =>
        updatePlayerLanguage(user, next),
      );
      languageUpdateQueue.current = request.then(
        () => undefined,
        () => undefined,
      );

      request
        .then((updatedPlayer) => {
          if (requestId === latestLanguageRequest.current) {
            setPlayer(updatedPlayer);
          }
        })
        .catch((error: unknown) => {
          console.error("Failed to persist language:", error);
          if (
            requestId === latestLanguageRequest.current &&
            previousPlayer
          ) {
            setPlayer(previousPlayer);
          }
        });
    },
    [setPlayer, user],
  );

  useEffect(() => {
    const legacyLanguage = window.localStorage.getItem(
      LEGACY_LANGUAGE_STORAGE_KEY,
    );
    if (!isPlayerLanguage(legacyLanguage)) {
      return;
    }

    const hasLanguageCookie = document.cookie
      .split(";")
      .some(
        (part) =>
          part.trim().split("=")[0] === PLAYER_LANGUAGE_COOKIE,
      );
    if (hasLanguageCookie) {
      window.localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
      return;
    }

    const migrationTimer = window.setTimeout(() => {
      window.localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
      setSelectedLanguage(legacyLanguage);
      persistBrowserLanguage(legacyLanguage);
    }, 0);
    return () => window.clearTimeout(migrationTimer);
  }, []);

  useEffect(() => {
    persistBrowserLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!user || !player || player.language) {
      return;
    }

    persistPlayerLanguage(selectedLanguage);
  }, [persistPlayerLanguage, player, selectedLanguage, user]);

  const setLanguage = useCallback(
    (next: PlayerLanguage) => {
      setSelectedLanguage(next);
      persistBrowserLanguage(next);

      if (user && player) {
        const previousPlayer = player;
        setPlayer({ ...player, language: next });
        persistPlayerLanguage(next, previousPlayer);
      }
    },
    [persistPlayerLanguage, player, setPlayer, user],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider
        locale={language}
        messages={messagesByLanguage[language]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
