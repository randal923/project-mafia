import { Request, Response, Router } from "express";
import { RespectStanding } from "../../../shared/season";
import { NewspaperService } from "../services/NewspaperService";
import { SeasonService } from "../services/SeasonService";

export class SeasonController {
  readonly router: Router;

  constructor(
    private readonly seasons: SeasonService,
    private readonly newspaper: NewspaperService,
  ) {
    this.router = Router();
    this.router.get("/", this.getSeason);
    this.router.get("/rankings", this.getRankings);
    this.router.get("/newspaper", this.getLatestEdition);
    this.router.get("/newspaper/archive", this.getArchive);
  }

  private getSeason = async (_req: Request, res: Response): Promise<void> => {
    res.json({ season: await this.seasons.getActiveSeason() });
  };

  private getRankings = async (_req: Request, res: Response): Promise<void> => {
    const season = await this.seasons.getActiveSeason();
    const snapshot = await this.seasons
      .seasonRef(season.id)
      .collection("respect")
      .orderBy("respect", "desc")
      .limit(50)
      .get();

    res.json({
      season,
      standings: snapshot.docs.map((doc) => {
        const standing = doc.data() as RespectStanding;
        return { ...standing, respect: Math.round(standing.respect) };
      }),
    });
  };

  private getLatestEdition = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    res.json({ edition: await this.newspaper.latest() });
  };

  private getArchive = async (_req: Request, res: Response): Promise<void> => {
    res.json({ editions: await this.newspaper.archive() });
  };
}
