import { NextFunction, Request, Response } from 'express';
import { EnvConfig } from '../config/env';

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ErrorHandler {
  constructor(private readonly config: EnvConfig) {}

  notFound = (req: Request, res: Response): void => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  };

  handle = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    console.error('Unhandled error:', err);
    const message =
      !this.config.isProduction && err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  };
}
