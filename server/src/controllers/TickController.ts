import { NextFunction, Request, Response, Router } from "express";
import { EnvConfig } from "../config/env";
import { HttpError } from "../middleware/errorHandler";
import { SeasonTickService } from "../services/SeasonTickService";

/**
 * The scheduled-work entry point. Cloud Scheduler (or any cron) POSTs
 * /internal/tick with the shared secret; everything the world needs done
 * on a clock happens in one idempotent sweep. Not Firebase-authed — the
 * caller is infrastructure, not a player.
 */
export class TickController {
  readonly router: Router;

  constructor(
    private readonly config: EnvConfig,
    private readonly tickService: SeasonTickService,
  ) {
    this.router = Router();
    this.router.post("/tick", this.authorize, this.tick);
  }

  private authorize = (req: Request, _res: Response, next: NextFunction): void => {
    const secret = this.config.cronSecret;
    // Without a configured secret the endpoint only works outside prod.
    if (!secret) {
      if (this.config.isProduction) {
        throw new HttpError(403, "Scheduled work is not configured.");
      }
      next();
      return;
    }
    if (req.get("x-cron-secret") !== secret) {
      throw new HttpError(401, "Bad cron credentials.");
    }
    next();
  };

  private tick = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.tickService.tick());
  };
}
