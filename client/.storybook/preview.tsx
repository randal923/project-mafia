import type { Preview } from "@storybook/nextjs";
import { NextIntlClientProvider } from "next-intl";
import "../src/app/globals.css";
import { mafiaFonts } from "../src/app/mafiaFonts";
import en from "../src/messages/en.json";

const mafiaFontClassName = `${mafiaFonts.sans.variable} ${mafiaFonts.display.variable}`;

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={en}>
        <div className={mafiaFontClassName}>
          <Story />
        </div>
      </NextIntlClientProvider>
    )
  ],
  parameters: {
    backgrounds: {
      default: "Operations floor",
      values: [
        { name: "Operations floor", value: "#030303" },
        { name: "Evidence paper", value: "#f4eee3" }
      ]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    layout: "centered"
  }
};

export default preview;
