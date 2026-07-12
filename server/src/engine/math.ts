export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}
