import type { ApiErrorDescriptor } from "../../../shared/apiError";
import { formatApiError } from "./formatApiError";

function fallbackDescriptor(statusCode: number): ApiErrorDescriptor {
  if (statusCode >= 500) return { code: "internal_error" };
  if (statusCode === 401) return { code: "unauthenticated" };
  if (statusCode === 402) return { code: "insufficient_funds" };
  if (statusCode === 403) return { code: "forbidden" };
  if (statusCode === 404) return { code: "resource_not_found" };
  if (statusCode === 409) return { code: "conflict" };
  if (statusCode === 429) return { code: "rate_limited" };
  if (statusCode >= 400 && statusCode < 500) {
    return { code: "invalid_request" };
  }
  return { code: "request_failed" };
}

export class HttpError extends Error {
  readonly descriptor: ApiErrorDescriptor;

  constructor(
    readonly statusCode: number,
    descriptorOrLogMessage: ApiErrorDescriptor | string,
    internalLogMessage?: string,
  ) {
    const descriptor: ApiErrorDescriptor =
      typeof descriptorOrLogMessage === "string"
        ? fallbackDescriptor(statusCode)
        : descriptorOrLogMessage;
    const logMessage =
      typeof descriptorOrLogMessage === "string"
        ? descriptorOrLogMessage
        : (internalLogMessage ?? formatApiError(descriptorOrLogMessage, "en"));

    super(logMessage);
    this.name = "HttpError";
    this.descriptor = descriptor;
  }
}
