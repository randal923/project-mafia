import { DocumentReference, Firestore } from "firebase-admin/firestore";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  CREW_ARCHETYPE_IDS,
  CREW_ARCHETYPES,
  CREW_ROSTER_CAP_BY_RANK,
  CREW_TIERS,
  CREW_TRAIT_IDS,
  CREW_UNLOCK_RANK,
  CrewArchetypeId,
  CrewCandidate,
  CrewMember,
  CrewRecruitmentPool,
  CrewTier,
  CrewTraitId,
  RECRUITMENT_POOL_SIZE,
  RECRUITMENT_REFRESH_HOURS,
  STARTING_CREW_LOYALTY,
  candidateTierWeights,
  crewHireCost,
  crewWage,
} from "../../../shared/crew";
import {
  CREW_FIRST_NAMES,
  CREW_LAST_NAMES,
  CREW_NICKNAMES,
  formatCrewName,
} from "../../../shared/crewNames";
import { PLAYER_RANKS, Player, normalizePlayer } from "../../../shared/player";
import { MissionRng } from "../engine/MissionRng";
import { HttpError } from "../middleware/errorHandler";
import { CrewService } from "./CrewService";
import { FirebaseService } from "./FirebaseService";
import { OpenAiProviderService } from "./ai/OpenAiProviderService";

const biosSchema = z.object({
  bios: z.array(z.string().min(1).max(200)),
});

/** Plain fallback bios by archetype when the LLM is unavailable. */
const FALLBACK_BIOS: Record<CrewArchetypeId, string[]> = {
  enforcer: [
    "Broke knuckles for three different families and never once raised his voice.",
    "Used to collect for the docks union. The docks union paid on time.",
  ],
  face: [
    "Talked his way out of two indictments and into every club in town.",
    "Sold a judge his own stolen watch back. The judge tipped.",
  ],
  fixer: [
    "Knows which desk at city hall loses paperwork for a hundred.",
    "Has a cousin in every records office between here and the river.",
  ],
  ghost: [
    "Three burglary charges, zero convictions, no photographs known to exist.",
    "Once walked out of a locked evidence room with the lock.",
  ],
  mastermind: [
    "Plans jobs on butcher paper and burns it before the coffee cools.",
    "Counts cards, counts exits, counts on nobody.",
  ],
  underboss: [
    "Ran a six-man crew through the last war without losing a soldier.",
    "Soldiers stand straighter when he walks the room.",
  ],
  wirehead: [
    "Opened his first safe at eleven. It was his father's. They still talk.",
    "Can wire a bypass faster than the alarm company can dial.",
  ],
};

/**
 * The daily hiring pool: 4-6 candidates drawn by player level, refreshed
 * every real day like the job board. The LLM writes one-line bios around
 * engine-decided numbers — never the numbers themselves.
 */
export class RecruitmentService {
  private readonly db: Firestore;

  constructor(
    firebase: FirebaseService,
    private readonly crew: CrewService,
    private readonly provider: OpenAiProviderService,
  ) {
    this.db = firebase.firestore;
  }

  async getPool(player: Player): Promise<CrewRecruitmentPool> {
    this.assertUnlocked(player);

    const snapshot = await this.poolRef(player.id).get();
    if (snapshot.exists) {
      const pool = snapshot.data() as CrewRecruitmentPool;
      const ageMs = Date.now() - Date.parse(pool.generatedAt);
      if (ageMs < RECRUITMENT_REFRESH_HOURS * 3_600_000) {
        return pool;
      }
    }

    return this.regenerate(player);
  }

  async regenerate(player: Player): Promise<CrewRecruitmentPool> {
    const rng = new MissionRng(randomBytes(16).toString("hex"), "recruitment");
    const candidates: CrewCandidate[] = [];

    for (let i = 0; i < RECRUITMENT_POOL_SIZE; i += 1) {
      candidates.push(this.rollCandidate(rng, player.progression.level, i));
    }

    await this.writeBios(candidates);

    const pool: CrewRecruitmentPool = {
      candidates,
      generatedAt: new Date().toISOString(),
    };
    await this.poolRef(player.id).set(pool);
    return pool;
  }

  /** Puts a candidate on the payroll: cash down, roster slot filled. */
  async hire(uid: string, candidateId: string): Promise<CrewMember> {
    const playerRef = this.db.collection("players").doc(uid);
    const poolRef = this.poolRef(uid);

    return this.db.runTransaction(async (tx) => {
      const [playerSnapshot, poolSnapshot, crewSnapshot] = await Promise.all([
        tx.get(playerRef),
        tx.get(poolRef),
        tx.get(this.crew.crewRef(uid)),
      ]);

      if (!playerSnapshot.exists) {
        throw new HttpError(404, "Player not found.");
      }
      if (!poolSnapshot.exists) {
        throw new HttpError(404, "No candidates in the pool right now.");
      }

      const player = normalizePlayer(playerSnapshot.data() as Player);
      this.assertUnlocked(player);

      const cap = CREW_ROSTER_CAP_BY_RANK[player.rank];
      if (crewSnapshot.size >= cap) {
        throw new HttpError(
          409,
          `Your rank carries a crew of ${cap}. Climb higher to hire more.`,
        );
      }

      const pool = poolSnapshot.data() as CrewRecruitmentPool;
      const candidate = pool.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        throw new HttpError(404, "That candidate has moved on.");
      }
      if (player.resources.cash < candidate.hireCost) {
        throw new HttpError(402, "You can't cover the signing money.");
      }

      const nowIso = new Date().toISOString();
      const member: CrewMember = {
        archetype: candidate.archetype,
        assignment: null,
        bio: candidate.bio,
        busyUntil: null,
        confiscatedLoadout: null,
        createdAt: nowIso,
        id: randomUUID(),
        loadout: {},
        loyalty: STARTING_CREW_LOYALTY,
        name: candidate.name,
        skillLevel: candidate.skillLevel,
        status: "idle",
        tier: candidate.tier,
        traits: candidate.traits,
        unpaidSince: null,
        updatedAt: nowIso,
        wagesSettledAt: nowIso,
      };

      tx.set(this.crew.crewRef(uid).doc(member.id), member);
      tx.set(poolRef, {
        ...pool,
        candidates: pool.candidates.filter((c) => c.id !== candidateId),
      });
      tx.set(playerRef, {
        ...player,
        resources: {
          ...player.resources,
          cash: player.resources.cash - candidate.hireCost,
        },
        updatedAt: nowIso,
      });

      return member;
    });
  }

  private rollCandidate(
    rng: MissionRng,
    playerLevel: number,
    index: number,
  ): CrewCandidate {
    const tier = this.weightedTier(rng, playerLevel, index);
    const archetype =
      CREW_ARCHETYPE_IDS[rng.hashValue(`arch:${index}`) % CREW_ARCHETYPE_IDS.length]!;

    const jitter = (rng.hashValue(`skill:${index}`) % 21) - 10;
    const skillLevel = Math.min(
      95,
      Math.max(1, Math.round(playerLevel * 0.7 + tier * 4 + jitter)),
    );

    const traitRoll = rng.rollD100(`traits:${index}`);
    const traitCount = traitRoll <= 40 ? 0 : traitRoll <= 80 ? 1 : 2;
    const traits = rng.pickDistinct(
      CREW_TRAIT_IDS,
      traitCount,
      `trait-pick:${index}`,
    ) as CrewTraitId[];

    const name = formatCrewName(
      CREW_FIRST_NAMES[rng.hashValue(`first:${index}`) % CREW_FIRST_NAMES.length]!,
      CREW_NICKNAMES[rng.hashValue(`nick:${index}`) % CREW_NICKNAMES.length]!,
      CREW_LAST_NAMES[rng.hashValue(`last:${index}`) % CREW_LAST_NAMES.length]!,
    );

    const fallbackPool = FALLBACK_BIOS[archetype];
    const bio = fallbackPool[rng.hashValue(`bio:${index}`) % fallbackPool.length]!;

    return {
      archetype,
      bio,
      hireCost: crewHireCost(tier, skillLevel, traits),
      id: randomUUID(),
      name,
      skillLevel,
      tier,
      traits,
      wage: crewWage(tier, skillLevel, traits),
    };
  }

  private weightedTier(
    rng: MissionRng,
    playerLevel: number,
    index: number,
  ): CrewTier {
    const weights = candidateTierWeights(playerLevel);
    const total = CREW_TIERS.reduce((sum, tier) => sum + weights[tier], 0);
    let roll = rng.hashValue(`tier:${index}`) % Math.max(1, Math.round(total));

    for (const tier of CREW_TIERS) {
      roll -= weights[tier];
      if (roll < 0) {
        return tier;
      }
    }
    return 1;
  }

  /** One batch LLM call for the pool's bios; fallbacks already in place. */
  private async writeBios(candidates: CrewCandidate[]): Promise<void> {
    try {
      const roster = candidates
        .map(
          (c, i) =>
            `${i + 1}. ${c.name} — ${CREW_ARCHETYPES[c.archetype].label}, tier ${c.tier}`,
        )
        .join("\n");

      const raw = await this.provider.generateJson({
        systemPrompt:
          "You write terse noir character bios for a 1970s mafia game. Reply with JSON only.",
        userPrompt: `Write one bio line (under 140 characters, period-era, no emoji) for each recruit below. Return {"bios": ["...", ...]} with exactly ${candidates.length} entries, in order.\n\n${roster}`,
      });

      const parsed = biosSchema.safeParse(raw);
      if (parsed.success && parsed.data.bios.length === candidates.length) {
        parsed.data.bios.forEach((bio, i) => {
          candidates[i]!.bio = bio;
        });
      }
    } catch {
      // Keep the archetype fallbacks — the pool must never fail on prose.
    }
  }

  private assertUnlocked(player: Player): void {
    const unlockIndex = PLAYER_RANKS.indexOf(CREW_UNLOCK_RANK);
    if (PLAYER_RANKS.indexOf(player.rank) < unlockIndex) {
      throw new HttpError(
        403,
        "Nobody works for a nobody. Make a name first.",
      );
    }
  }

  private poolRef(uid: string): DocumentReference {
    return this.db
      .collection("players")
      .doc(uid)
      .collection("recruitment")
      .doc("current");
  }
}
