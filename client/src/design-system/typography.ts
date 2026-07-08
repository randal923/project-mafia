export const displayText = "font-display uppercase leading-none tracking-normal";

export const typography = {
  brandMark: `${displayText} text-4xl text-title`,
  commandLabel: `${displayText} text-xl text-ink`,
  dialogTitle: `${displayText} text-5xl text-title md:text-6xl`,
  eyebrow: `${displayText} text-2xl text-brass`,
  leadBody: "text-xl leading-relaxed text-ink",
  metadata: "text-sm font-medium leading-normal text-faint",
  narrativeBody: "text-xl leading-relaxed text-muted",
  panelHeading: `${displayText} text-3xl text-title`,
  paragraph: "text-base leading-relaxed text-muted",
  screenTitle: `${displayText} text-6xl text-title md:text-7xl`,
  statValue: `${displayText} text-5xl text-ink`,
  subtitle: "text-xl leading-relaxed text-muted"
} as const;
