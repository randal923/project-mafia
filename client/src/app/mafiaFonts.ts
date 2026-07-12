import { Bebas_Neue, Lora, Oswald } from "next/font/google";

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

/** Readable serif for long-form story text and choices. */
const mafiaNarrative = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-mafia-narrative"
});

export const mafiaFonts = {
  display: mafiaDisplay,
  narrative: mafiaNarrative,
  sans: mafiaSans
};
