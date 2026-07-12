export const displayText = "font-display uppercase leading-none tracking-normal";

/** Readable serif used for story prose and player choices. */
export const narrativeText = "font-narrative normal-case tracking-normal";

export const typography = {
  brandMark: `${displayText} text-4xl text-title`,
  commandLabel: `${displayText} text-xl text-ink`,
  dialogTitle: `${displayText} text-5xl text-title md:text-6xl`,
  eyebrow: `${displayText} text-2xl text-brass`,
  leadBody: `${narrativeText} text-xl leading-relaxed text-ink`,
  metadata: "text-sm font-medium leading-normal text-faint",
  narrativeBody: `${narrativeText} text-lg leading-relaxed text-muted`,
  narrativeCaption: `${narrativeText} text-sm leading-normal text-faint`,
  narrativeParagraph: `${narrativeText} text-base leading-relaxed text-muted`,
  panelHeading: `${displayText} text-3xl text-title`,
  paragraph: "text-base leading-relaxed text-muted",
  screenTitle: `${displayText} text-6xl text-title md:text-7xl`,
  statValue: `${displayText} text-5xl text-ink`,
  subtitle: "text-xl leading-relaxed text-muted"
} as const;
