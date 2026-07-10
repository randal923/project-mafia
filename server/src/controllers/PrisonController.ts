import { Request, Response, Router } from "express";
import { Player } from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { PlayerService } from "../services/PlayerService";
import { PrisonService } from "../services/PrisonService";

export class PrisonController {
  readonly router: Router;

  constructor(
    private readonly players: PlayerService,
    private readonly prison: PrisonService,
  ) {
    this.router = Router();
    this.router.get("/status", this.getStatus);
    this.router.post("/bribe", this.bribe);
    this.router.post("/escape", this.escape);
  }

  private getStatus = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    res.json(this.prison.status(player));
  };

  private bribe = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    const result = await this.prison.bribe(player.id);
    res.json(result);
  };

  private escape = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    const result = await this.prison.escape(player.id);
    res.json(result);
  };

  private async requirePlayer(req: Request): Promise<Player> {
    if (!req.uid) {
      throw new HttpError(401, "Unauthenticated");
    }

    const player = await this.players.getPlayer(req.uid);
    if (!player) {
      throw new HttpError(404, "Player not found");
    }

    return player;
  }
}
