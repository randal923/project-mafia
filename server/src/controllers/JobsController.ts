import { Request, Response, Router } from "express";
import {
  acceptJobRequestSchema,
  chooseRequestSchema,
} from "../../../shared/jobSchemas";
import { Player } from "../../../shared/player";
import { HttpError } from "../middleware/errorHandler";
import { JobBoardService } from "../services/JobBoardService";
import { MissionService } from "../services/MissionService";
import { MissionViewService } from "../services/MissionViewService";
import { PlayerService } from "../services/PlayerService";

export class JobsController {
  readonly router: Router;

  constructor(
    private readonly players: PlayerService,
    private readonly board: JobBoardService,
    private readonly missions: MissionService,
  ) {
    this.router = Router();
    this.router.get("/board", this.getBoard);
    this.router.post("/board/regenerate", this.regenerateBoard);
    this.router.post("/accept", this.accept);
    this.router.get("/missions/active", this.getActiveMission);
    this.router.get("/missions/:missionId", this.getMission);
    this.router.post("/missions/:missionId/choose", this.choose);
  }

  private getBoard = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    res.json(await this.board.getBoard(player));
  };

  private regenerateBoard = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const player = await this.requirePlayer(req);

    if (await this.missions.hasActiveMission(player.id)) {
      throw new HttpError(409, "Finish your current job first.");
    }

    res.json(await this.board.regenerate(player));
  };

  private accept = async (req: Request, res: Response): Promise<void> => {
    const parsed = acceptJobRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      );
    }

    const player = await this.requirePlayer(req);
    const mission = await this.missions.acceptJob(
      player,
      parsed.data.offerId,
      parsed.data.crewIds ?? [],
    );
    res.status(201).json({ mission: MissionViewService.toView(mission) });
  };

  private getActiveMission = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const player = await this.requirePlayer(req);
    const mission = await this.missions.getActiveMission(player);

    if (!mission) {
      throw new HttpError(404, "No job in progress.");
    }

    res.json({ mission: MissionViewService.toView(mission) });
  };

  private getMission = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    const mission = await this.missions.getMission(
      player,
      String(req.params.missionId),
    );
    res.json({ mission: MissionViewService.toView(mission) });
  };

  private choose = async (req: Request, res: Response): Promise<void> => {
    const parsed = chooseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      );
    }

    const player = await this.requirePlayer(req);
    const result = await this.missions.choose(
      player,
      String(req.params.missionId),
      parsed.data.choiceId,
    );

    res.json({
      mission: MissionViewService.toView(result.mission),
      player: result.player,
    });
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
