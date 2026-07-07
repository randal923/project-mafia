import type { JsonObject } from "../types";
import { isRecord } from "./isRecord";

export function parseJsonObject(rawText: string): JsonObject | null {
  try {
    const parsed = JSON.parse(rawText) as unknown;

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
