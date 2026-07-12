"use client";

import {
  DEFAULT_PLAYER_LANGUAGE,
  isPlayerLanguage,
  type PlayerLanguage
} from "@shared/language";
import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { updatePlayerLanguage } from "../../lib/api";
import en from "../../messages/en.json";
import ptBR from "../../messages/pt-BR.json";
import { useAuth } from "../AuthProvider/AuthProvider";
import { usePlayer } from "../PlayerProvider/PlayerProvider";

export const LANGUAGE_STORAGE_KEY = "project-mafia.language";

const messagesByLanguage: Record<PlayerLanguage, typeof en> = {
  en,
  "pt-BR": ptBR
};

export function detectBrowserLanguage(): PlayerLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_PLAYER_LANGUAGE;
  }

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of candidates) {
    const lower = tag?.toLowerCase() ?? "";
    if (lower.startsWith("pt")) {
      return "pt-BR";
    }
    if (lower.startsWith("en")) {
      return "en";
    }
  }

  return DEFAULT_PLAYER_LANGUAGE;
}

function readStoredLanguage(): PlayerLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isPlayerLanguage(stored) ? stored : null;
}

/** Stored preference if any, otherwise the browser's language. */
function localLanguage(): PlayerLanguage {
  return readStoredLanguage() ?? detectBrowserLanguage();
}

type LanguageContextValue = {
  language: PlayerLanguage;
  setLanguage: (language: PlayerLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { user } = useAuth();
  const { player, setPlayer } = usePlayer();
  // Starts at the default so server and client render the same HTML; the
  // real preference is picked up right after mount.
  const [language, setLanguageState] = useState<PlayerLanguage>(
    DEFAULT_PLAYER_LANGUAGE
  );

  // Signed out (or profile still loading): browser language, remembered in
  // local storage so the choice survives until login.
  useEffect(() => {
    if (player) {
      return;
    }

    const local = localLanguage();
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, local);
    setLanguageState(local);
  }, [player]);

  // Signed in: the profile wins. A profile that never chose a language
  // inherits the local/browser one, persisted to the DB; either way local
  // storage is cleared because the DB is now the source of truth.
  useEffect(() => {
    if (!user || !player) {
      return;
    }

    if (player.language) {
      setLanguageState(player.language);
      window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      return;
    }

    const inherited = localLanguage();
    setLanguageState(inherited);
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    updatePlayerLanguage(user, inherited)
      .then(setPlayer)
      .catch((error: unknown) => {
        console.error("Failed to persist language:", error);
      });
  }, [user, player, setPlayer]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (next: PlayerLanguage) => {
      setLanguageState(next);

      if (user && player) {
        updatePlayerLanguage(user, next)
          .then(setPlayer)
          .catch((error: unknown) => {
            console.error("Failed to persist language:", error);
          });
        return;
      }

      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    },
    [user, player, setPlayer]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider
        locale={language}
        messages={messagesByLanguage[language]}
        // Dates are formatted with Intl.DateTimeFormat directly; this only
        // silences next-intl's environment-fallback warning during SSR.
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
