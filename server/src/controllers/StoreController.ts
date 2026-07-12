import { Request, Response, Router } from "express";
import {
  buyEquipmentRequestSchema,
  sellItemRequestSchema,
} from "../../../shared/storeSchemas";
import { HttpError } from "../middleware/errorHandler";
import { StoreService } from "../services/StoreService";

export class StoreController {
  readonly router: Router;

  constructor(private readonly store: StoreService) {
    this.router = Router();
    this.router.get("/catalog", this.getCatalog);
    this.router.post("/buy", this.buy);
    this.router.post("/sell", this.sell);
  }

  private getCatalog = async (_req: Request, res: Response): Promise<void> => {
    res.json({ items: await this.store.catalog() });
  };

  private buy = async (req: Request, res: Response): Promise<void> => {
    const parsed = buyEquipmentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      );
    }

    const player = await this.store.buy(
      this.requireUid(req),
      parsed.data.equipmentId,
    );
    res.json({ player });
  };

  private sell = async (req: Request, res: Response): Promise<void> => {
    const parsed = sellItemRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      );
    }

    const player = await this.store.sell(
      this.requireUid(req),
      parsed.data.itemId,
      parsed.data.quantity ?? 1,
    );
    res.json({ player });
  };

  private requireUid(req: Request): string {
    if (!req.uid) {
      throw new HttpError(401, "Unauthenticated");
    }
    return req.uid;
  }
}
