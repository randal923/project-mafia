import { randomBytes } from "node:crypto";
import { DocumentReference, Firestore } from "firebase-admin/firestore";
import { JobBoard } from "../../../shared/job";
import { Player } from "../../../shared/player";
import { JobOfferBuilder } from "../engine/JobOfferBuilder";
import { PlayerContextService } from "../engine/PlayerContextService";
import { EngineConfigService } from "./EngineConfigService";
import { FirebaseService } from "./FirebaseService";
import { MissionTemplateService } from "./MissionTemplateService";

/**
 * Bump when the OFFER SHAPE changes (new fields like staminaCost/gear),
 * so boards stored with the old shape regenerate on next fetch. Template
 * content changes are covered separately by the template-id part of the
 * key.
 */
const BOARD_FORMAT_VERSION = 2;

export class JobBoardService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly templates: MissionTemplateService,
    private readonly engine: EngineConfigService,
  ) {
    this.db = firebase.firestore;
  }

  async getBoard(player: Player): Promise<JobBoard> {
    const snapshot = await this.boardRef(player.id).get();

    if (snapshot.exists) {
      const board = snapshot.data() as JobBoard;
      // A stale board (mission files added/removed since it was built)
      // regenerates so new mission lines show up without a manual refresh.
      if (board.templatesKey === this.templatesKey()) {
        return board;
      }
    }

    return this.regenerate(player);
  }

  async regenerate(player: Player): Promise<JobBoard> {
    const board: JobBoard = {
      generatedAt: new Date().toISOString(),
      offers: JobOfferBuilder.buildOffers(
        PlayerContextService.fromPlayer(player),
        randomBytes(16).toString("hex"),
        this.templates.all(),
        this.engine.config,
      ),
      templatesKey: this.templatesKey(),
    };

    await this.boardRef(player.id).set(board);
    return board;
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
