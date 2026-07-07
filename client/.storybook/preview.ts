import type { Preview } from "@storybook/nextjs";
import { createElement } from "react";
import "../src/app/globals.css";
import { mafiaFonts } from "../src/app/mafiaFonts";

const mafiaFontClassName = `${mafiaFonts.sans.variable} ${mafiaFonts.display.variable}`;

const preview: Preview = {
  decorators: [
    (Story) =>
      createElement("div", { className: mafiaFontClassName }, Story())
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
