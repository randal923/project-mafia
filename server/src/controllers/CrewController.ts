import { Request, Response, Router } from "express";
import { playerLanguageFromHeader } from "../../../shared/playerLanguageFromHeader";
import {
  bribeCrewRequestSchema,
  equipCrewRequestSchema,
  fireCrewRequestSchema,
  hireCrewRequestSchema,
  trainCrewRequestSchema,
  unequipCrewRequestSchema,
} from "../../../shared/crewSchemas";
import { HttpError } from "../middleware/errorHandler";
import { CrewService } from "../services/CrewService";
import { PlayerService } from "../services/PlayerService";
import { RecruitmentService } from "../services/RecruitmentService";

export class CrewController {
  readonly router: Router;

  constructor(
    private readonly players: PlayerService,
    private readonly crew: CrewService,
    private readonly recruitment: RecruitmentService,
  ) {
    this.router = Router();
    this.router.get("/", this.getRoster);
    this.router.get("/recruitment", this.getRecruitment);
    this.router.post("/hire", this.hire);
    this.router.post("/fire", this.fire);
    this.router.post("/train", this.train);
    this.router.post("/bribe", this.bribe);
    this.router.post("/equip", this.equip);
    this.router.post("/unequip", this.unequip);
  }

  private getRoster = async (req: Request, res: Response): Promise<void> => {
    const result = await this.crew.settle(this.requireUid(req));
    res.json(result);
  };

  private getRecruitment = async (req: Request, res: Response): Promise<void> => {
    const player = await this.requirePlayer(req);
    res.json({ pool: await this.recruitment.getPool(player) });
  };

  private hire = async (req: Request, res: Response): Promise<void> => {
    const parsed = hireCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const member = await this.recruitment.hire(
      await this.requirePlayer(req),
      parsed.data.candidateId,
    );
    const result = await this.crew.settle(this.requireUid(req));
    res.json({ ...result, hired: member });
  };

  private fire = async (req: Request, res: Response): Promise<void> => {
    const parsed = fireCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const crew = await this.crew.fire(this.requireUid(req), parsed.data.memberId);
    res.json({ crew });
  };

  private train = async (req: Request, res: Response): Promise<void> => {
    const parsed = trainCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(await this.crew.train(this.requireUid(req), parsed.data.memberId));
  };

  private bribe = async (req: Request, res: Response): Promise<void> => {
    const parsed = bribeCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(await this.crew.bribe(this.requireUid(req), parsed.data.memberId));
  };

  private equip = async (req: Request, res: Response): Promise<void> => {
    const parsed = equipCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.crew.equip(
        this.requireUid(req),
        parsed.data.memberId,
        parsed.data.itemId,
      ),
    );
  };

  private unequip = async (req: Request, res: Response): Promise<void> => {
    const parsed = unequipCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.crew.unequip(
        this.requireUid(req),
        parsed.data.memberId,
        parsed.data.slot,
      ),
    );
  };

  private async requirePlayer(req: Request) {
    const player = await this.players.getPlayer(this.requireUid(req));
    if (!player) {
      throw new HttpError(404, { code: "player_not_found" });
    }
    return {
      ...player,
      language: playerLanguageFromHeader(
        req.header("accept-language"),
        player.language ?? "en",
      ),
    };
  }

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, { code: "unauthenticated" });
    }
    return req.uid;
  }
}
