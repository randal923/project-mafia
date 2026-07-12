import { typography } from "./typography";

type TypographyStyle = {
  className: string;
  colorSwatchClassName: string;
  colorToken: string;
  font: string;
  lineHeight: string;
  name: string;
  sample: string;
  size: string;
  usage: string;
  weight: string;
};

export const typographyStyles = [
  {
    className: typography.screenTitle,
    colorSwatchClassName: "bg-title",
    colorToken: "text-title",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Screen title",
    sample: "Crew Ledger",
    size: "text-6xl / md:text-7xl",
    usage: "Primary screen title or major game-state heading.",
    weight: "400"
  },
  {
    className: typography.dialogTitle,
    colorSwatchClassName: "bg-title",
    colorToken: "text-title",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Dialog title",
    sample: "The Harbor Turns",
    size: "text-5xl / md:text-6xl",
    usage: "Modal titles, narrative choice titles, and focused decision states.",
    weight: "400"
  },
  {
    className: typography.brandMark,
    colorSwatchClassName: "bg-title",
    colorToken: "text-title",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Brand mark",
    sample: "Project Mafia",
    size: "text-4xl",
    usage: "Top-level brand lockup in persistent navigation.",
    weight: "400"
  },
  {
    className: typography.panelHeading,
    colorSwatchClassName: "bg-title",
    colorToken: "text-title",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Panel heading",
    sample: "Territory Report",
    size: "text-3xl",
    usage: "Panel titles, toast titles, and compact section headings.",
    weight: "400"
  },
  {
    className: typography.subtitle,
    colorSwatchClassName: "bg-muted",
    colorToken: "text-muted",
    font: "Oswald",
    lineHeight: "leading-relaxed",
    name: "Subtitle",
    sample: "Cash flow, heat, and crew pressure at a glance.",
    size: "text-xl",
    usage: "Supporting line below a screen title or section heading.",
    weight: "400"
  },
  {
    className: typography.eyebrow,
    colorSwatchClassName: "bg-brass",
    colorToken: "text-brass",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Eyebrow label",
    sample: "Decision Required",
    size: "text-2xl",
    usage: "Kickers, field labels, stat labels, and narrative metadata.",
    weight: "400"
  },
  {
    className: typography.commandLabel,
    colorSwatchClassName: "bg-ink",
    colorToken: "text-ink",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Command label",
    sample: "Run Next Turn",
    size: "text-xl",
    usage: "Primary buttons, navigation items, compact tags, and controls.",
    weight: "400"
  },
  {
    className: typography.statValue,
    colorSwatchClassName: "bg-ink",
    colorToken: "text-ink",
    font: "Bebas Neue",
    lineHeight: "leading-none",
    name: "Stat value",
    sample: "$48K",
    size: "text-5xl",
    usage: "Short numeric resource values and dashboard readouts.",
    weight: "400"
  },
  {
    className: typography.leadBody,
    colorSwatchClassName: "bg-ink",
    colorToken: "text-ink",
    font: "Oswald",
    lineHeight: "leading-relaxed",
    name: "Lead body",
    sample: "A council contact is asking for an answer before dawn.",
    size: "text-xl",
    usage: "Decision intros and body copy that needs higher emphasis.",
    weight: "400"
  },
  {
    className: typography.narrativeBody,
    colorSwatchClassName: "bg-muted",
    colorToken: "text-muted",
    font: "Oswald",
    lineHeight: "leading-relaxed",
    name: "Narrative body",
    sample: "The docks are quiet, but every favor now carries interest.",
    size: "text-xl",
    usage: "NarrativeCard copy and longer story-facing text.",
    weight: "400"
  },
  {
    className: typography.paragraph,
    colorSwatchClassName: "bg-muted",
    colorToken: "text-muted",
    font: "Oswald",
    lineHeight: "leading-relaxed",
    name: "Paragraph",
    sample: "Assign crew before the next turn resolves.",
    size: "text-base",
    usage: "Component descriptions, helper copy, and compact content.",
    weight: "400"
  },
  {
    className: typography.metadata,
    colorSwatchClassName: "bg-faint",
    colorToken: "text-faint",
    font: "Oswald",
    lineHeight: "leading-normal",
    name: "Metadata",
    sample: "Updated 04:20",
    size: "text-sm",
    usage: "Timestamps, secondary status, and low-emphasis labels.",
    weight: "500"
  }
] as const satisfies readonly TypographyStyle[];
