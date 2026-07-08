export const toneTextClasses = {
  brass: "text-brass",
  brassBright: "text-brass-bright",
  danger: "text-danger-strong",
  ink: "text-ink",
  muted: "text-muted",
  profit: "text-profit",
  teal: "text-teal"
} as const;

export type TextTone = keyof typeof toneTextClasses;

export const toneBackgroundClasses = {
  brass: "bg-brass",
  danger: "bg-danger-strong",
  profit: "bg-profit",
  teal: "bg-teal"
} as const;

export type BackgroundTone = keyof typeof toneBackgroundClasses;

export const toneBorderClasses = {
  brass: "border-brass",
  danger: "border-danger-strong",
  line: "border-line",
  profit: "border-profit",
  teal: "border-teal"
} as const;

export type BorderTone = keyof typeof toneBorderClasses;

export const toneTopBorderClasses = {
  brass: "border-t-brass",
  brassBright: "border-t-brass-bright",
  danger: "border-t-danger-strong",
  line: "border-t-line",
  profit: "border-t-profit",
  teal: "border-t-teal"
} as const;

export type TopBorderTone = keyof typeof toneTopBorderClasses;
