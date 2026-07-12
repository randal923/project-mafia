import { CollectionReference, Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { gameTime } from "../../../shared/gameTime";
import type { PlayerLanguage } from "../../../shared/language";
import {
  EDITION_INTERVAL_HOURS,
  MAX_ARTICLES_PER_EDITION,
  NEWSPAPER_NAME,
  NEWSPAPER_SECTIONS,
  NewspaperClassified,
  NewspaperCopy,
  NewspaperEdition,
  NewspaperStanding,
  WorldEvent,
} from "../../../shared/newspaper";
import { RespectStanding, Season } from "../../../shared/season";
import { FirebaseService } from "./FirebaseService";
import { OpenAiProviderService } from "./ai/OpenAiProviderService";
import { getNewspaperFallbackCopy } from "./getNewspaperFallbackCopy";
import { isLikelyPortugueseText } from "./isLikelyPortugueseText";
import { WorldEventService } from "./WorldEventService";

const editionCopySchema = z.object({
  articles: z
    .array(
      z.object({
        body: z.string().min(1).max(900),
        section: z.enum(NEWSPAPER_SECTIONS),
        title: z.string().min(1).max(120),
      }),
    )
    .max(MAX_ARTICLES_PER_EDITION),
  headline: z.object({
    body: z.string().min(1).max(900),
    title: z.string().min(1).max(120),
  }),
});

/**
 * The City Ledger. A scheduled job aggregates the season's world events,
 * ranks the stories by weight, and has the LLM write period copy AROUND
 * the facts — it never invents one. Editions are city-wide documents,
 * served identically to every player.
 */
export class NewspaperService {
  private readonly db: Firestore;
  private latestCache: { at: number; edition: NewspaperEdition | null } | null =
    null;

  constructor(
    firebase: FirebaseService,
    private readonly worldEvents: WorldEventService,
    private readonly provider: OpenAiProviderService,
  ) {
    this.db = firebase.firestore;
  }

  /** Publishes an edition if the interval has passed. Tick-driven. */
  async generateIfDue(season: Season, sinceIso: string): Promise<NewspaperEdition | null> {
    const ageMs = Date.now() - Date.parse(sinceIso);
    if (ageMs < EDITION_INTERVAL_HOURS * 3_600_000) {
      return null;
    }
    return this.generate(season, sinceIso);
  }

  async generate(season: Season, sinceIso: string): Promise<NewspaperEdition> {
    const nowIso = new Date().toISOString();
    const [events, respectStandings] = await Promise.all([
      this.worldEvents.since(season.id, sinceIso),
      this.standings(season.id),
    ]);
    const standings: NewspaperStanding[] = respectStandings.map((s) => ({
      familyColor: s.familyColor,
      familyName: s.familyName,
      respect: Math.round(s.respect),
      turfCount: s.turfCount ?? 0,
    }));

    const topStories = [...events]
      .sort((a, b) => b.weight - a.weight || b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_ARTICLES_PER_EDITION);

    const [copy, portugueseCopy] = await Promise.all([
      this.writeCopy(topStories, standings, "en"),
      this.writeCopy(topStories, standings, "pt-BR"),
    ]);
    const edition: NewspaperEdition = {
      articles: copy.articles,
      classifieds: this.classifieds(respectStandings),
      gameDay: gameTime(Date.now()).day,
      headline: copy.headline,
      id: randomUUID(),
      mastheadChampion: season.champion,
      ptBR: portugueseCopy,
      publishedAt: nowIso,
      seasonId: season.id,
      standings,
    };

    await this.editions.doc(edition.id).set(edition);
    this.latestCache = null;
    return edition;
  }

  async latest(): Promise<NewspaperEdition | null> {
    if (this.latestCache && Date.now() - this.latestCache.at < 60_000) {
      return this.latestCache.edition;
    }

    const snapshot = await this.editions
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();
    const edition = snapshot.empty
      ? null
      : (snapshot.docs[0]!.data() as NewspaperEdition);

    this.latestCache = { at: Date.now(), edition };
    return edition;
  }

  async archive(limit = 10): Promise<NewspaperEdition[]> {
    const snapshot = await this.editions
      .orderBy("publishedAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data() as NewspaperEdition);
  }

  /** The standing city bounty, if any — enforced by the attack pipeline. */
  async activeBounty(): Promise<
    Extract<NewspaperClassified, { type: "bounty" }> | null
  > {
    const edition = await this.latest();
    const bounty = edition?.classifieds.find(
      (entry): entry is Extract<NewspaperClassified, { type: "bounty" }> =>
        entry.type === "bounty",
    );
    return bounty ?? null;
  }

  private async standings(seasonId: string): Promise<RespectStanding[]> {
    const snapshot = await this.db
      .collection("seasons")
      .doc(seasonId)
      .collection("respect")
      .orderBy("respect", "desc")
      .limit(8)
      .get();

    return snapshot.docs.map((doc) => doc.data() as RespectStanding);
  }

  /**
   * Classifieds that bite: the city posts a bounty on the front-runner —
   * flipping their turf pays out on top of the skim.
   */
  private classifieds(standings: RespectStanding[]): NewspaperClassified[] {
    const classifieds: NewspaperClassified[] = [];
    const leader = standings[0];

    if (leader && leader.respect > 0 && leader.familyName) {
      const bounty = Math.min(
        50_000,
        Math.max(500, Math.round(leader.respect / 2 / 5) * 5),
      );
      classifieds.push({
        bounty,
        targetName: leader.familyName,
        targetUid: leader.uid,
        text: `Concerned citizens offer $${bounty} to any party who relieves the ${leader.familyName} family of a block of its territory. Discretion guaranteed.`,
        type: "bounty",
      });
    }

    return classifieds;
  }

  private async writeCopy(
    stories: WorldEvent[],
    standings: NewspaperStanding[],
    language: PlayerLanguage,
  ): Promise<NewspaperCopy> {
    const fallback = getNewspaperFallbackCopy(stories, language);
    if (stories.length === 0) {
      return fallback;
    }

    const facts = stories
      .map((event, i) => `${i + 1}. [${event.type}] ${event.summary}`)
      .join("\n");
    const table = standings
      .map((s, i) => `${i + 1}. ${s.familyName} — ${s.respect} respect, ${s.turfCount} blocks`)
      .join("\n");

    try {
      const portugueseInstruction =
        language === "pt-BR"
          ? " Write every headline and article in natural Brazilian Portuguese (português do Brasil)."
          : " Write every headline and article in English.";
      const raw = await this.provider.generateJson({
        systemPrompt:
          `You are the night editor of "${NEWSPAPER_NAME}", a 1970s big-city broadsheet that covers organized crime with a straight face and a dry wit. ` +
          "You write prose around the facts you are given and NEVER invent events, names, or numbers." +
          portugueseInstruction +
          " Reply with JSON only.",
        userPrompt:
          `Write tonight's edition from these facts.${portugueseInstruction} Return JSON: {"headline": {"title", "body"}, "articles": [{"section", "title", "body"}]}. ` +
          `Sections must be among: ${NEWSPAPER_SECTIONS.join(", ")}. The biggest story becomes the headline; write up to ${Math.min(stories.length, MAX_ARTICLES_PER_EDITION)} shorter articles for the rest. ` +
          `Bodies under 120 words, period voice, no emoji.\n\nFACTS:\n${facts}\n\nSTANDINGS:\n${table}`,
      });

      const parsed = editionCopySchema.safeParse(raw);
      if (
        parsed.success &&
        (language !== "pt-BR" || isLikelyPortugueseText(parsed.data))
      ) {
        return {
          articles: parsed.data.articles,
          headline: { ...parsed.data.headline, section: "front_page" },
        };
      }
    } catch {
      // fall through to the factual fallback
    }
    return fallback;
  }

  private get editions(): CollectionReference {
    return this.db.collection("newspaper");
  }
}
