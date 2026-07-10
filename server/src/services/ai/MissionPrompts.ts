import { ChoiceEdge, Mission, MissionNode } from "../../../../shared/job";
import { Player } from "../../../../shared/player";
import { PlayerContextService } from "../../engine/PlayerContextService";
import { NarrationInput, OutcomeNarrationInput } from "./MissionNarrator";

/**
 * Builds prompts for the game master model. Every mechanical fact in a
 * prompt is already decided by the engine — the model narrates known
 * results and writes choice labels; it never decides outcomes or numbers.
 */
export class MissionPrompts {
  static systemPrompt(): string {
    return [
      "You are the game master for Project Mafia, a grounded crime RPG.",
      "The engine facts are law. Never change or invent job details, check results, outcomes, money, heat, or experience — you narrate results the engine has already decided.",
      "Write polished interactive crime fiction: concrete details, active verbs, social pressure, and consequences the player can feel.",
      "Use clear, plain English. Prefer common words over stylized slang, ornate phrasing, or poetic compression.",
      "Keep the prose tense and specific without melodrama, parody noir, generic tough-guy cliches, or purple description.",
      "Use short-to-medium sentences. Avoid choppy fragments, stacked clauses, semicolons, and long scene-setting paragraphs.",
      "Every image must be easy to picture. Do not invent unclear phrases like wet rope shadows.",
      "Address the player in second person as you. Never use the player's real name or nickname in narration, choices, stakes, titles, or summaries.",
      "Every sentence should either sharpen the place, reveal a human motive, raise pressure, or pay off a prior choice.",
      "Keep violence consequential and not glamorous.",
      "Choices must be playable, distinct, and grounded in the current scene. Never offer cosmetic choices that lead to the same beat.",
      "Choice labels describe what the player attempts. They must never hint at whether the attempt will succeed or fail.",
      "Return only valid JSON. Do not wrap JSON in markdown.",
    ].join("\n");
  }

  static beatPrompt(input: NarrationInput): string {
    const { edgeTaken, node } = input;
    const sections = [
      this.playerSection(input.player),
      this.jobSection(input.mission),
      this.storySoFarSection(input.ancestors),
    ];

    if (edgeTaken === null) {
      sections.push(
        "THIS BEAT: This is the opening scene of the job. Set the scene from the job premise and bring the player to the moment of the first decision.",
      );
    } else {
      sections.push(
        `THIS BEAT: The player just attempted "${edgeTaken.approach}" (a ${edgeTaken.check.skill} check, difficulty ${edgeTaken.check.difficulty} of 10). ` +
          this.describeResult(edgeTaken) +
          " Narrate that known result and carry the scene forward to the next decision.",
      );
    }

    sections.push(
      "NEXT CHOICES (write one label/intent/riskHint for each, in this exact order — results of these checks are NOT decided yet, so do not foreshadow success or failure):\n" +
        JSON.stringify(
          (node.choices ?? []).map((choice) => ({
            approach: choice.approach,
            checkDifficulty: choice.check.difficulty,
            skillTested: choice.check.skill,
          })),
          null,
          2,
        ),
    );

    sections.push(
      'OUTPUT JSON exactly in this shape: {"title": string (max 90 chars), "scene": string (2-4 sentences), "stakes": string (one sentence of what is at risk right now), "choices": [{"label": string (max 120 chars, imperative), "intent": string (one sentence of what the player hopes to achieve), "riskHint": string (one sentence hinting at the danger of this approach)}, {…}]} with exactly 2 choices.',
    );

    return sections.join("\n\n");
  }

  static outcomePrompt(input: OutcomeNarrationInput): string {
    const { node, rewards } = input;
    const tier = node.outcomeTier ?? "partial_failure";

    const sections = [
      this.playerSection(input.player),
      this.jobSection(input.mission),
      this.storySoFarSection(input.ancestors),
      `FINAL RESULT (engine-decided, narrate it faithfully): outcome tier "${tier}". ` +
        this.describeTier(tier) +
        ` The player's take is $${rewards.cashChange}, heat rises by ${rewards.heatChange}, and they earn ${rewards.xpChange} experience. Reference the money and the attention plainly; never state other numbers.`,
      'OUTPUT JSON exactly in this shape: {"title": string (max 90 chars), "narration": string (3-5 sentences ending the job), "storySummary": string (ONE past-tense sentence recording what happened, for the player\'s long-term story)}.',
    ];

    return sections.join("\n\n");
  }

  private static playerSection(player: Player): string {
    const context = PlayerContextService.fromPlayer(player);

    return (
      "PLAYER (always call them 'you'):\n" +
      JSON.stringify(
        {
          cash: player.resources.cash,
          effectivePower: context.effectivePower,
          heat: context.heat,
          importantFacts: player.narrative.llmMemory.importantFacts,
          level: player.progression.level,
          rank: player.rank,
          storySoFar: player.narrative.storySummary || "This is their first job.",
          unresolvedConflicts: player.narrative.llmMemory.unresolvedConflicts,
        },
        null,
        2,
      )
    );
  }

  private static jobSection(mission: Mission): string {
    return (
      "JOB (engine facts, immutable):\n" +
      JSON.stringify(
        {
          difficulty: mission.offer.difficulty,
          district: mission.offer.district,
          location: mission.offer.storySeed.location,
          premise: mission.offer.storySeed.premise,
          pressure: mission.offer.storySeed.pressure,
          type: mission.offer.type,
        },
        null,
        2,
      )
    );
  }

  private static storySoFarSection(ancestors: MissionNode[]): string {
    if (ancestors.length === 0) {
      return "STORY SO FAR: none — this job is just beginning.";
    }

    return (
      "STORY SO FAR (scenes already shown to the player, oldest first):\n" +
      JSON.stringify(
        ancestors.map((ancestor) => ({
          scene: ancestor.narrative?.body ?? "(not written)",
          title: ancestor.narrative?.title ?? "(not written)",
        })),
        null,
        2,
      )
    );
  }

  private static describeResult(edge: ChoiceEdge): string {
    const { margin, passed } = edge.roll;
    const wide = Math.abs(margin) >= 40;

    if (passed) {
      return wide
        ? "The attempt SUCCEEDED spectacularly — it could not have gone better."
        : "The attempt SUCCEEDED.";
    }
    return wide
      ? "The attempt FAILED badly — narrate it going seriously wrong."
      : "The attempt FAILED.";
  }

  private static describeTier(tier: string): string {
    switch (tier) {
      case "jackpot":
        return "A perfect run: the player walks away with more than the job was supposed to pay.";
      case "successful":
        return "A clean success with a full take and little attention.";
      case "partially_successful":
        return "A success, but messy: a reduced take and loose ends.";
      case "partial_failure":
        return "The job mostly fell apart: only scraps salvaged, and the police took notice.";
      case "failure":
        return "A total failure: no money, and the player ends the night in a hospital bed. End the narration there.";
      case "disaster":
        return "A catastrophe: the player is caught and spends the night in jail before being released. End the narration there.";
      default:
        return "";
    }
  }
}
