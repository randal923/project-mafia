"use client";

import {
  DEFAULT_PLAYER_LANGUAGE,
  isPlayerLanguage,
  PLAYER_LANGUAGE_COOKIE,
  type PlayerLanguage,
} from "@shared/language";
import { useSyncExternalStore } from "react";
import en from "../messages/en.json";
import ptBR from "../messages/pt-BR.json";

function browserLanguage(): PlayerLanguage {
  const cookieLanguage = document.cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === PLAYER_LANGUAGE_COOKIE)?.[1];
  if (isPlayerLanguage(cookieLanguage)) {
    return cookieLanguage;
  }
  if (navigator.language.toLowerCase().startsWith("pt")) {
    return "pt-BR";
  }
  return DEFAULT_PLAYER_LANGUAGE;
}

function subscribeToBrowserLanguage(): () => void {
  return () => undefined;
}

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  const language = useSyncExternalStore<PlayerLanguage | null>(
    subscribeToBrowserLanguage,
    browserLanguage,
    () => null,
  );

  const messages = language === null ? null : language === "pt-BR" ? ptBR : en;

  return (
    <html lang={language ?? DEFAULT_PLAYER_LANGUAGE} suppressHydrationWarning>
      <body>
        {messages ? (
          <main className="flex min-h-screen items-center justify-center bg-page px-6 text-center text-ink">
            <div className="flex max-w-lg flex-col items-center gap-4">
              <h1 className="text-4xl font-bold">
                {messages.framework.globalError.title}
              </h1>
              <p>{messages.framework.globalError.body}</p>
              <button
                className="rounded-control border border-brass px-4 py-2"
                onClick={reset}
                type="button"
              >
                {messages.framework.globalError.retry}
              </button>
            </div>
          </main>
        ) : null}
      </body>
    </html>
  );
}
