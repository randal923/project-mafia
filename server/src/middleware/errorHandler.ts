import { NextFunction, Request, Response } from "express";
import { playerLanguageFromHeader } from "../../../shared/playerLanguageFromHeader";
import { HttpError } from "../errors/HttpError";
import { formatApiError } from "../errors/formatApiError";

export { HttpError } from "../errors/HttpError";

export class ErrorHandler {
  notFound = (req: Request, res: Response): void => {
    const language = playerLanguageFromHeader(req.header("accept-language"));
    const descriptor = { code: "route_not_found" } as const;
    res.status(404).json({
      code: descriptor.code,
      error: formatApiError(descriptor, language),
    });
  };

  handle = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    const language = playerLanguageFromHeader(req.header("accept-language"));
    if (err instanceof HttpError) {
      if (err.statusCode >= 500) {
        console.error("Internal HTTP error:", err);
      }
      res.status(err.statusCode).json({
        code: err.descriptor.code,
        error: formatApiError(err.descriptor, language),
      });
      return;
    }

    console.error("Unhandled error:", err);
    const descriptor = { code: "internal_error" } as const;
    res.status(500).json({
      code: descriptor.code,
      error: formatApiError(descriptor, language),
    });
  };
}
