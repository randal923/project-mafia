import { Request, Response, Router } from "express";
import {
  createPlayerRequestSchema,
  updatePlayerLanguageRequestSchema,
} from "../../../shared/playerSchemas";
import {
  equipItemRequestSchema,
  unequipSlotRequestSchema,
  useItemRequestSchema,
} from "../../../shared/storeSchemas";
import { HttpError } from "../middleware/errorHandler";
import { LoadoutService } from "../services/LoadoutService";
import { PlayerService } from "../services/PlayerService";

export class PlayerController {
  readonly router: Router;

  constructor(
    private readonly players: PlayerService,
    private readonly loadout: LoadoutService,
  ) {
    this.router = Router();
    this.router.get("/me", this.getMe);
    this.router.post("/", this.create);
    this.router.post("/me/equip", this.equip);
    this.router.post("/me/unequip", this.unequip);
    this.router.post("/me/use", this.use);
    this.router.post("/me/language", this.setLanguage);
    this.router.get("/me/precinct-quote", this.precinctQuote);
    this.router.post("/me/bribe-heat", this.bribeHeat);
  }

  private getMe = async (req: Request, res: Response): Promise<void> => {
    const player = await this.players.getPlayer(this.requireUid(req));

    if (!player) {
      throw new HttpError(404, { code: "player_not_found" });
    }

    res.json(player);
  };

  private create = async (req: Request, res: Response): Promise<void> => {
    const parsed = createPlayerRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.players.createPlayer(
      this.requireUid(req),
      parsed.data.name,
      parsed.data.language ?? null,
    );
    res.status(201).json(player);
  };

  private setLanguage = async (req: Request, res: Response): Promise<void> => {
    const parsed = updatePlayerLanguageRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.players.setLanguage(
      this.requireUid(req),
      parsed.data.language,
    );
    res.json(player);
  };

  private equip = async (req: Request, res: Response): Promise<void> => {
    const parsed = equipItemRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.loadout.equip(this.requireUid(req), parsed.data.itemId);
    res.json(player);
  };

  private unequip = async (req: Request, res: Response): Promise<void> => {
    const parsed = unequipSlotRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.loadout.unequip(this.requireUid(req), parsed.data.slot);
    res.json(player);
  };

  private use = async (req: Request, res: Response): Promise<void> => {
    const parsed = useItemRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, { code: "invalid_request" });
    }

    const player = await this.loadout.useItem(this.requireUid(req), parsed.data.itemId);
    res.json(player);
  };

  private precinctQuote = async (req: Request, res: Response): Promise<void> => {
    const player = await this.players.getPlayer(this.requireUid(req));
    if (!player) {
      throw new HttpError(404, { code: "player_not_found" });
    }

    res.json(await this.players.precinctQuoteWithPerks(player));
  };

  private bribeHeat = async (req: Request, res: Response): Promise<void> => {
    const player = await this.players.bribeHeat(this.requireUid(req));
    res.json(player);
  };

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, { code: "unauthenticated" });
    }
    return req.uid;
  }
}
