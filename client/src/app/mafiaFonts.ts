import { Bebas_Neue, Oswald } from "next/font/google";

const mafiaDisplay = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-mafia-display",
  weight: "400"
});

const mafiaSans = Oswald({
  subsets: ["latin"],
  variable: "--font-mafia-sans",
  weight: ["400", "500", "600", "700"]
});

export const mafiaFonts = {
  display: mafiaDisplay,
  sans: mafiaSans
};
