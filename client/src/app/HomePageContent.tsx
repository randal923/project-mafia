"use client";

import type { NewspaperEdition } from "@shared/newspaper";
import type { PlayerNotification } from "@shared/notification";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider/AuthProvider";
import { usePlayer } from "../components/PlayerProvider/PlayerProvider";
import { displayText, typography } from "../design-system/typography";
import { fetchLatestEdition, fetchNotifications } from "../lib/api";
import { selectNewspaperCopy } from "../lib/selectNewspaperCopy";
import { useNotificationText } from "../lib/useNotificationText";

const quickLinkCards = [
  { href: "/jobs", id: "jobs" },
  { href: "/crew", id: "crew" },
  { href: "/empire", id: "empire" },
  { href: "/map", id: "map" },
] as const;

/** The morning ritual: the front page, your mail, and where to go next. */
export function HomePageContent() {
  const { user } = useAuth();
  const { player, status } = usePlayer();
  const [edition, setEdition] = useState<NewspaperEdition | null>(null);
  const [unread, setUnread] = useState<PlayerNotification[]>([]);
  const t = useTranslations("home");
  const tNewspaper = useTranslations("newspaper");
  const locale = useLocale();
  const notificationText = useNotificationText();

  useEffect(() => {
    if (!user) {
      return;
    }
    let isCancelled = false;
    fetchLatestEdition(user)
      .then((result) => {
        if (!isCancelled) {
          setEdition(result.edition);
        }
      })
      .catch(() => undefined);
    fetchNotifications(user)
      .then((result) => {
        if (!isCancelled) {
          setUnread(result.notifications.filter((n) => !n.read));
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [user]);

  if (status === "loading" || status === "missing" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>{t("loading")}</p>
      </div>
    );
  }

  const newspaperCopy = edition
    ? selectNewspaperCopy(
        edition,
        locale === "pt-BR" ? "pt-BR" : "en",
        tNewspaper,
      )
    : null;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header>
        <h1 className={`m-0 ${typography.panelHeading}`}>
          {t("greeting", { name: player.name })}
        </h1>
        <p className={`mt-1 mb-0 ${typography.paragraph}`}>{t("intro")}</p>
      </header>

      {unread.length > 0 ? (
        <section className="rounded-panel border border-danger bg-danger/10 px-6 py-4">
          <h2 className={`m-0 ${displayText} text-xl text-danger-strong`}>
            {t("whileAway")}
          </h2>
          <ul className="mt-2 mb-0 flex list-none flex-col gap-1 p-0">
            {unread.slice(0, 5).map((notification) => {
              const text = notificationText(notification);
              return (
                <li className={typography.paragraph} key={notification.id}>
                  <strong>{text.title}.</strong> {text.body}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {edition && newspaperCopy ? (
        <section className="rounded-panel border border-line bg-neutral-950 px-8 py-6 shadow-panel">
          <p className="m-0 text-center font-serif text-xs tracking-[0.3em] text-neutral-500 uppercase">
            {t("masthead", { day: edition.gameDay, name: tNewspaper("name") })}
          </p>
          <h2 className="mt-2 mb-0 text-center font-serif text-4xl leading-tight font-black text-neutral-100">
            {newspaperCopy.headline.title}
          </h2>
          <p className="mt-3 mb-0 text-center font-serif text-lg leading-relaxed text-neutral-300">
            {newspaperCopy.headline.body}
          </p>
          <p className="mt-4 mb-0 text-center">
            <Link
              className={`${displayText} text-lg text-brass underline-offset-4 hover:underline`}
              href="/newspaper"
            >
              {t("readFullEdition")}
            </Link>
          </p>
        </section>
      ) : (
        <section className="rounded-panel border border-line bg-surface px-6 py-5 shadow-panel">
          <p className={`m-0 ${typography.narrativeCaption}`}>
            {t("noEditionYet", { name: tNewspaper("name") })}
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinkCards.map((card) => (
          <Link
            className="rounded-panel border border-line bg-surface p-5 shadow-panel transition-colors duration-150 hover:border-brass"
            href={card.href}
            key={card.href}
          >
            <p className={`m-0 ${displayText} text-2xl text-title`}>
              {t(`cards.${card.id}.title`)}
            </p>
            <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
              {t(`cards.${card.id}.body`)}
            </p>
          </Link>
        ))}
      </section>

      <p className={`m-0 ${typography.metadata}`}>
        <Link className="hover:text-brass" href="/rankings">
          {t("seasonStandings")}
        </Link>
      </p>
    </div>
  );
}
