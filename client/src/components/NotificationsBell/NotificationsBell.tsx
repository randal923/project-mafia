"use client";

import type { PlayerNotification } from "@shared/notification";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import {
  fetchNotifications,
  markNotificationsRead,
} from "../../lib/api";
import { cx } from "../../lib/cx";
import { useNotificationText } from "../../lib/useNotificationText";
import { useAuth } from "../AuthProvider/AuthProvider";

const POLL_INTERVAL_MS = 60_000;

/**
 * The while-you-were-away feed: attacks, raids, desertions, releases.
 * Polls quietly; the unread count is the loud part.
 */
export function NotificationsBell() {
  const t = useTranslations("notifications");
  const notificationText = useNotificationText();
  const locale = useLocale();
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      }),
    [locale],
  );
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;
    const load = () => {
      fetchNotifications(user)
        .then((result) => {
          if (!isCancelled) {
            setNotifications(result.notifications);
          }
        })
        .catch(() => undefined);
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && unreadCount > 0 && user) {
      void markNotificationsRead(user)
        .then(() =>
          setNotifications((current) =>
            current.map((n) => ({ ...n, read: true })),
          ),
        )
        .catch(() => undefined);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? t("bellLabelUnread", { count: unreadCount })
            : t("bellLabel")
        }
        className={cx(
          `inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control border px-4 py-2 ${displayText} text-lg transition-colors duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright`,
          unreadCount > 0
            ? "border-danger text-danger-strong"
            : "border-line text-muted hover:border-brass hover:text-brass",
        )}
        onClick={handleToggle}
        type="button"
      >
        {t("bell")}
        {unreadCount > 0 ? (
          <span className="rounded-control border border-danger px-2 text-base">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 max-h-96 w-96 overflow-y-auto rounded-panel border border-line bg-surface p-3 shadow-panel">
          {notifications.length === 0 ? (
            <p className={`m-0 p-3 ${typography.metadata}`}>{t("empty")}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {notifications.map((notification) => {
                const text = notificationText(notification);
                return (
                  <li
                    className="rounded-control border border-line bg-black/20 p-3"
                    key={notification.id}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`m-0 ${displayText} text-lg text-title`}>
                        {text.title}
                      </p>
                      <span className={typography.metadata}>
                        {timeFormatter.format(Date.parse(notification.createdAt))}
                      </span>
                    </div>
                    <p className={`mt-1 mb-0 ${typography.narrativeCaption}`}>
                      {text.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
