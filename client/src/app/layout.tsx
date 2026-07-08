import type { Metadata } from "next";
import { AppShell } from "../components/AppShell/AppShell";
import { AuthGuard } from "../components/AuthGuard/AuthGuard";
import { AuthProvider } from "../components/AuthProvider/AuthProvider";
import { PlayerProvider } from "../components/PlayerProvider/PlayerProvider";
import { mafiaFonts } from "./mafiaFonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Mafia",
  description: "Narrative operations console for a browser crime strategy game."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${mafiaFonts.sans.variable} ${mafiaFonts.display.variable}`}
    >
      <body>
        <AuthProvider>
          <AuthGuard>
            <PlayerProvider>
              <AppShell>{children}</AppShell>
            </PlayerProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
