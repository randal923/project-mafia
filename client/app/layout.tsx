import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { AuthProvider } from "./auth/AuthProvider";
import { Navigation } from "./components/Navigation";
import "./globals.css";
import { ProfileBootstrap } from "./profile/components/ProfileBootstrap";

const mafiaSans = Jost({
  variable: "--font-mafia-sans",
  subsets: ["latin"],
});

const mafiaSerif = Cormorant_Garamond({
  variable: "--font-mafia-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Project Mafia",
  description: "Project Mafia is a browser based mafia game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mafiaSans.variable} ${mafiaSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navigation />
          <ProfileBootstrap />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
