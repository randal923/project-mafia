import { Request, Response, Router } from "express";
import { HttpError } from "../middleware/errorHandler";
import { NotificationService } from "../services/NotificationService";

export class NotificationsController {
  readonly router: Router;

  constructor(private readonly notifications: NotificationService) {
    this.router = Router();
    this.router.get("/", this.list);
    this.router.post("/read-all", this.readAll);
  }

  private list = async (req: Request, res: Response): Promise<void> => {
    res.json({ notifications: await this.notifications.list(this.requireUid(req)) });
  };

  private readAll = async (req: Request, res: Response): Promise<void> => {
    await this.notifications.markAllRead(this.requireUid(req));
    res.json({ ok: true });
  };

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, { code: "unauthenticated" });
    }
    return req.uid;
  }
}
