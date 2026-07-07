export type AppErrorResult = {
  message: string;
};

type APIErrorPayload = {
  error?: string;
};

export class APIError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

export class AppErrorHandler {
  static async createAPIError(
    response: Response,
    fallbackMessage: string,
  ): Promise<APIError> {
    const payload = (await response.json().catch(() => ({}))) as APIErrorPayload;

    return new APIError(payload.error ?? fallbackMessage, response.status);
  }

  static handle(
    error: unknown,
    fallbackMessage: string,
  ): AppErrorResult {
    if (error instanceof APIError) {
      throw error;
    }

    return {
      message: AppErrorHandler.getMessage(error, fallbackMessage),
    };
  }

  static toResult(
    error: unknown,
    fallbackMessage: string,
  ): AppErrorResult {
    try {
      return AppErrorHandler.handle(error, fallbackMessage);
    } catch (handledError) {
      return {
        message: AppErrorHandler.getMessage(handledError, fallbackMessage),
      };
    }
  }

  static getMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage;
  }
}
