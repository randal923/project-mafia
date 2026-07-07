import { readString } from "./readString";

export function readNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : readString(value);
}
