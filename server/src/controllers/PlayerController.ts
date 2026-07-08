import { Request, Response, Router } from "express";
import { createPlayerRequestSchema } from "../../../shared/playerSchemas";
import { HttpError } from "../middleware/errorHandler";
import { PlayerService } from "../services/PlayerService";

export class PlayerController {
  readonly router: Router;

  constructor(private readonly players: PlayerService) {
    this.router = Router();
    this.router.get("/me", this.getMe);
    this.router.post("/", this.create);
  }

  private getMe = async (req: Request, res: Response): Promise<void> => {
    const player = await this.players.getPlayer(this.requireUid(req));

    if (!player) {
      throw new HttpError(404, "Player not found");
    }

    res.json(player);
  };

  private create = async (req: Request, res: Response): Promise<void> => {
    const parsed = createPlayerRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request body");
    }

    const player = await this.players.createPlayer(this.requireUid(req), parsed.data.name);
    res.status(201).json(player);
  };

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, "Unauthenticated");
    }
    return req.uid;
  }
}
