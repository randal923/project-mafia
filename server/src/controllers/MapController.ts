import { Request, Response, Router } from "express";
import { playerLanguageFromHeader } from "../../../shared/playerLanguageFromHeader";
import {
  buildRacketRequestSchema,
  buildingTargetRequestSchema,
  staffBuildingRequestSchema,
} from "../../../shared/buildingSchemas";
import { Player } from "../../../shared/player";
import {
  assignTurfCrewRequestSchema,
  claimTurfRequestSchema,
  foundFamilyRequestSchema,
} from "../../../shared/territorySchemas";
import { attackTurfRequestSchema } from "../../../shared/territorySchemas";
import { HttpError } from "../middleware/errorHandler";
import { AttackService } from "../services/AttackService";
import { MissionViewService } from "../services/MissionViewService";
import { PlayerService } from "../services/PlayerService";
import { TerritoryService } from "../services/TerritoryService";

export class MapController {
  readonly router: Router;

  constructor(
    private readonly players: PlayerService,
    private readonly territory: TerritoryService,
    private readonly attacks: AttackService,
  ) {
    this.router = Router();
    this.router.get("/", this.getMap);
    this.router.get("/battles", this.getBattles);
    this.router.post("/family", this.foundFamily);
    this.router.post("/claim", this.claim);
    this.router.post("/attack", this.attack);
    this.router.post("/defense", this.assignDefense);
    this.router.post("/build", this.build);
    this.router.post("/upgrade", this.upgrade);
    this.router.post("/repair", this.repair);
    this.router.post("/staff", this.staff);
    this.router.post("/collect", this.collect);
  }

  private getBattles = async (req: Request, res: Response): Promise<void> => {
    res.json({
      battles: await this.attacks.recentBattles(this.requireUid(req)),
    });
  };

  private attack = async (req: Request, res: Response): Promise<void> => {
    const parsed = attackTurfRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const battle = await this.attacks.attack(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.crewIds,
    );
    res.status(201).json({ battle });
  };

  private getMap = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.territory.mapView());
  };

  private foundFamily = async (req: Request, res: Response): Promise<void> => {
    const parsed = foundFamilyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.territory.foundFamily(
      this.requireUid(req),
      parsed.data.color,
      parsed.data.name,
    );
    res.json({ player });
  };

  private claim = async (req: Request, res: Response): Promise<void> => {
    const parsed = claimTurfRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.requirePlayer(req);
    const mission = await this.territory.claimTurf(
      player,
      parsed.data.turfId,
      parsed.data.crewIds ?? [],
    );
    res.status(201).json({ mission: MissionViewService.toView(mission) });
  };

  private assignDefense = async (req: Request, res: Response): Promise<void> => {
    const parsed = assignTurfCrewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const turf = await this.territory.assignDefense(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.crewIds,
    );
    res.json({ turf });
  };

  private build = async (req: Request, res: Response): Promise<void> => {
    const parsed = buildRacketRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const turf = await this.territory.buildRacket(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.definitionId,
    );
    res.json({ turf });
  };

  private upgrade = async (req: Request, res: Response): Promise<void> => {
    const parsed = buildingTargetRequestSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.turfId) {
      throw new HttpError(400, {
        code: "required_fields",
        params: { count: 2 },
      });
    }

    const turf = await this.territory.upgradeRacket(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.buildingId,
    );
    res.json({ turf });
  };

  private repair = async (req: Request, res: Response): Promise<void> => {
    const parsed = buildingTargetRequestSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.turfId) {
      throw new HttpError(400, {
        code: "required_fields",
        params: { count: 2 },
      });
    }

    const turf = await this.territory.repairRacket(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.buildingId,
    );
    res.json({ turf });
  };

  private staff = async (req: Request, res: Response): Promise<void> => {
    const parsed = staffBuildingRequestSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.turfId) {
      throw new HttpError(400, {
        code: "required_fields",
        params: { count: 3 },
      });
    }

    const turf = await this.territory.staffRacket(
      this.requireUid(req),
      parsed.data.turfId,
      parsed.data.buildingId,
      parsed.data.crewIds,
    );
    res.json({ turf });
  };

  private collect = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.territory.collectTurfs(this.requireUid(req)));
  };

  private async requirePlayer(req: Request): Promise<Player> {
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
