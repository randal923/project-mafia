import { AppShell } from "../components/AppShell/AppShell";
import { AuthGuard } from "../components/AuthGuard/AuthGuard";
import { AuthProvider } from "../components/AuthProvider/AuthProvider";
import { LanguageProvider } from "../components/LanguageProvider/LanguageProvider";
import { PlayerProvider } from "../components/PlayerProvider/PlayerProvider";
import { mafiaFonts } from "./mafiaFonts";
import { getLocalizedMetadata } from "../lib/getLocalizedMetadata";
import { getRequestLanguage } from "../lib/getRequestLanguage";
import "./globals.css";

export const generateMetadata = () => getLocalizedMetadata();

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialLanguage = await getRequestLanguage();

  return (
    <html
      lang={initialLanguage}
      className={`${mafiaFonts.sans.variable} ${mafiaFonts.display.variable} ${mafiaFonts.narrative.variable}`}
    >
      <body>
        <AuthProvider>
          <PlayerProvider>
            <LanguageProvider initialLanguage={initialLanguage}>
              <AuthGuard>
                <AppShell>{children}</AppShell>
              </AuthGuard>
            </LanguageProvider>
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
