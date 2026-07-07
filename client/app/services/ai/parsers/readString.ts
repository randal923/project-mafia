export function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
