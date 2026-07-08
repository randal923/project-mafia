"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "../AuthProvider/AuthProvider";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import { NavigationBar } from "../NavigationBar/NavigationBar";

const navigationItems = [
  { href: "/", id: "news", label: "News" },
  { href: "/jobs", id: "jobs", label: "Jobs" },
  { href: "/character", id: "character", label: "Character" }
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { user, signOutUser } = useAuth();
  const pathname = usePathname();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  if (!user || pathname === "/login") {
    return children;
  }

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
        <NavigationBar
          actions={
            <Button
              className="ml-8"
              onClick={() => setIsSignOutModalOpen(true)}
              size="small"
              variant="danger"
            >
              Sign out
            </Button>
          }
          activeItemId={activeItemId}
          brand="Project Mafia"
          items={navigationItems}
        />
        <div className="mt-8 min-h-0 flex-1">{children}</div>
      </div>
      <Modal
        eyebrow="Leaving the operation"
        intro="You are about to sign out. The family will keep your affairs in order until you return."
        onDismiss={() => setIsSignOutModalOpen(false)}
        open={isSignOutModalOpen}
        options={[
          {
            description: "Return to the operation as if nothing happened.",
            id: "stay",
            label: "Stay",
            onSelect: () => setIsSignOutModalOpen(false)
          },
          {
            description: "End the session and head back to the door.",
            id: "sign-out",
            label: "Sign out",
            onSelect: handleSignOut,
            tone: "danger"
          }
        ]}
        title="Sure you want out?"
      />
    </main>
  );
}
