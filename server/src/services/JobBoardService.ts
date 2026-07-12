import { randomBytes } from "node:crypto";
import { DocumentReference, Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { JobBoard, JobOffer } from "../../../shared/job";
import { Player } from "../../../shared/player";
import { JobOfferBuilder } from "../engine/JobOfferBuilder";
import { PlayerContextService } from "../engine/PlayerContextService";
import { OpenAiProviderService } from "./ai/OpenAiProviderService";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";
import { MissionTemplateService } from "./MissionTemplateService";

/**
 * Bump when the OFFER SHAPE changes (new fields like staminaCost/gear),
 * so boards stored with old offer metadata regenerate on next fetch. The
 * template-id key separately catches mission additions and removals.
 */
const BOARD_FORMAT_VERSION = 4;

const localizedOffersSchema = z.object({
  offers: z.array(
    z.object({
      gearLabels: z.array(z.string()),
      location: z.string().min(1),
      premise: z.string().min(1),
      pressure: z.string().min(1),
    }),
  ),
});

export class JobBoardService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly templates: MissionTemplateService,
    private readonly engine: EngineConfigService,
    private readonly aiProvider: OpenAiProviderService,
  ) {
    this.db = firebase.firestore;
  }

  async getBoard(player: Player): Promise<JobBoard> {
    const snapshot = await this.boardRef(player.id).get();

    if (snapshot.exists) {
      const board = snapshot.data() as JobBoard;
      // A stale board (mission files added/removed since it was built, or
      // written in another language after a switch) regenerates so the
      // right offers show up without a manual refresh.
      if (this.isCurrent(board) && this.matchesLanguage(board, player)) {
        return board;
      }
    }

    return this.regenerate(player);
  }

  isCurrent(board: JobBoard): boolean {
    return board.templatesKey === this.templatesKey();
  }

  private matchesLanguage(board: JobBoard, player: Player): boolean {
    return (board.language ?? "en") === (player.language ?? "en");
  }

  async regenerate(player: Player): Promise<JobBoard> {
    const offers = JobOfferBuilder.buildOffers(
      PlayerContextService.fromPlayer(player),
      randomBytes(16).toString("hex"),
      this.templates.all(),
      this.engine.config,
    );

    const board: JobBoard = {
      generatedAt: new Date().toISOString(),
      ...(player.language && { language: player.language }),
      offers:
        player.language === "pt-BR"
          ? await this.localizeOffers(offers)
          : offers,
      templatesKey: this.templatesKey(),
    };

    await this.boardRef(player.id).set(board);
    return board;
  }

  /**
   * One batch LLM call that renders the offers' prose (story seed and gear
   * labels) in Brazilian Portuguese. The board must never fail on prose,
   * so any provider or shape problem falls back to the English originals.
   */
  private async localizeOffers(offers: JobOffer[]): Promise<JobOffer[]> {
    if (offers.length === 0) {
      return offers;
    }

    try {
      const briefs = offers.map((offer) => ({
        gearLabels: (offer.gear ?? []).map((entry) => entry.label),
        location: offer.storySeed.location,
        premise: offer.storySeed.premise,
        pressure: offer.storySeed.pressure,
      }));

      const raw = await this.aiProvider.generateJson({
        systemPrompt:
          "You translate short job briefs for a 1970s mafia crime game into natural Brazilian Portuguese (português do Brasil). Keep the tense, grounded tone. Never add, drop, or change facts, names, or amounts. Reply with JSON only.",
        userPrompt:
          'Translate every string below into Brazilian Portuguese. Return JSON with exactly this shape, the same counts, and the same order: {"offers": [{"location": string, "premise": string, "pressure": string, "gearLabels": string[]}]}\n\n' +
          JSON.stringify({ offers: briefs }, null, 2),
      });

      const parsed = localizedOffersSchema.safeParse(raw);
      if (!parsed.success || parsed.data.offers.length !== offers.length) {
        return offers;
      }

      return offers.map((offer, index) => {
        const localized = parsed.data.offers[index]!;
        const result: JobOffer = {
          ...offer,
          storySeed: {
            location: localized.location,
            premise: localized.premise,
            pressure: localized.pressure,
          },
        };
        if (offer.gear) {
          result.gear = offer.gear.map((entry, gearIndex) => ({
            ...entry,
            label: localized.gearLabels[gearIndex] ?? entry.label,
          }));
        }
        return result;
      });
    } catch {
      return offers;
    }
  }

  private templatesKey(): string {
    const ids = this.templates
      .all()
      .map((template) => template.id)
      .sort()
      .join(",");
    return `v${BOARD_FORMAT_VERSION}:${ids}`;
  }

  boardRef(uid: string): DocumentReference {
    return this.db
      .collection("players")
      .doc(uid)
      .collection("board")
      .doc("current");
  }
}
