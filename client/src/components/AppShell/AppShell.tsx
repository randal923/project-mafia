"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import { Button } from "../Button/Button";
import { GameClock } from "../GameClock/GameClock";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { Modal } from "../Modal/Modal";
import { NavigationBar } from "../NavigationBar/NavigationBar";
import { NotificationsBell } from "../NotificationsBell/NotificationsBell";
import { PlayerNameDialog } from "../PlayerNameDialog/PlayerNameDialog";
import { usePlayer } from "../PlayerProvider/PlayerProvider";

const navigationRoutes = [
  { href: "/", id: "news" },
  { href: "/jobs", id: "jobs" },
  { href: "/crew", id: "crew" },
  { href: "/empire", id: "empire" },
  { href: "/map", id: "map" },
  { href: "/store", id: "store" },
  { href: "/character", id: "character" },
  { href: "/loadout", id: "loadout" }
] as const;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { user, signOutUser } = useAuth();
  const { status: playerStatus } = usePlayer();
  const pathname = usePathname();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const t = useTranslations();

  if (!user || pathname === "/login") {
    return children;
  }

  const navigationItems = navigationRoutes.map((route) => ({
    ...route,
    label: t(`nav.${route.id}`)
  }));

  const activeItemId = navigationItems.find(
    (item) => item.href === pathname
  )?.id;

  const handleSignOut = async () => {
    setIsSignOutModalOpen(false);
    await signOutUser();
  };

  return (
    <main className="flex min-h-screen flex-col bg-page px-6 pb-6 text-ink lg:h-screen">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
        <div className="flex items-center justify-end gap-3 pt-2">
          <LanguageSwitcher />
          <GameClock />
          <Button
            onClick={() => setIsSignOutModalOpen(true)}
            size="small"
            variant="danger"
          >
            {t("shell.signOut")}
          </Button>
        </div>
        <NavigationBar
          actions={
            <div className="ml-8 flex items-center gap-3">
              <NotificationsBell />
            </div>
          }
          activeItemId={activeItemId}
          ariaLabel={t("nav.ariaLabel")}
          brand="Project Mafia"
          items={navigationItems}
        />
        <div className="mt-8 min-h-0 flex-1">{children}</div>
      </div>
      {playerStatus === "missing" && <PlayerNameDialog />}
      <Modal
        eyebrow={t("shell.signOutModal.eyebrow")}
        intro={t("shell.signOutModal.intro")}
        onDismiss={() => setIsSignOutModalOpen(false)}
        open={isSignOutModalOpen}
        options={[
          {
            description: t("shell.signOutModal.stayDescription"),
            id: "stay",
            label: t("shell.signOutModal.stayLabel"),
            onSelect: () => setIsSignOutModalOpen(false)
          },
          {
            description: t("shell.signOutModal.signOutDescription"),
            id: "sign-out",
            label: t("shell.signOutModal.signOutLabel"),
            onSelect: handleSignOut,
            tone: "danger"
          }
        ]}
        title={t("shell.signOutModal.title")}
      />
    </main>
  );
}
