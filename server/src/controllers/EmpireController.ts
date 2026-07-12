import { Request, Response, Router } from "express";
import {
  buildingTargetRequestSchema,
  buyPersonalBuildingRequestSchema,
  staffBuildingRequestSchema,
} from "../../../shared/buildingSchemas";
import { HttpError } from "../middleware/errorHandler";
import { BuildingService } from "../services/BuildingService";
import { TerritoryService } from "../services/TerritoryService";

export class EmpireController {
  readonly router: Router;

  constructor(
    private readonly buildings: BuildingService,
    private readonly territory: TerritoryService,
  ) {
    this.router = Router();
    this.router.get("/", this.getHoldings);
    this.router.get("/catalog", this.getCatalog);
    this.router.post("/buy", this.buy);
    this.router.post("/collect", this.collect);
    this.router.post("/upgrade", this.upgrade);
    this.router.post("/repair", this.repair);
    this.router.post("/staff", this.staff);
  }

  private getHoldings = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.buildings.listHoldings(this.requireUid(req)));
  };

  private getCatalog = async (_req: Request, res: Response): Promise<void> => {
    res.json({ catalog: this.buildings.catalog() });
  };

  private buy = async (req: Request, res: Response): Promise<void> => {
    const parsed = buyPersonalBuildingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.buildings.buyPersonal(
        this.requireUid(req),
        parsed.data.definitionId,
      ),
    );
  };

  private collect = async (req: Request, res: Response): Promise<void> => {
    const uid = this.requireUid(req);
    // Empty every till in one round: personal holdings AND the turf tills.
    const turfs = await this.territory.collectTurfs(uid);
    const holdings = await this.buildings.collectAll(uid);
    res.json({
      ...holdings,
      collected: holdings.collected + turfs.collected,
      raidedBuildingId: turfs.raidedBuildingId,
      upkeep: turfs.upkeep,
    });
  };

  private upgrade = async (req: Request, res: Response): Promise<void> => {
    const parsed = buildingTargetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.buildings.upgradePersonal(
        this.requireUid(req),
        parsed.data.buildingId,
      ),
    );
  };

  private repair = async (req: Request, res: Response): Promise<void> => {
    const parsed = buildingTargetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.buildings.repairPersonal(
        this.requireUid(req),
        parsed.data.buildingId,
      ),
    );
  };

  private staff = async (req: Request, res: Response): Promise<void> => {
    const parsed = staffBuildingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    res.json(
      await this.buildings.staffPersonal(
        this.requireUid(req),
        parsed.data.buildingId,
        parsed.data.crewIds,
      ),
    );
  };

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, { code: "unauthenticated" });
    }
    return req.uid;
  }
}
