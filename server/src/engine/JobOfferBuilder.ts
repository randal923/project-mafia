import { EngineConfig } from "../../../shared/engineConfig";
import { JobOffer } from "../../../shared/job";
import { MissionTemplate } from "../../../shared/missionTemplate";
import { JobCalculatorService } from "./JobCalculatorService";
import { MissionRng } from "./MissionRng";
import { EnginePlayerContext } from "./PlayerContextService";

/**
 * Builds the job board from the loaded mission templates. Pure and
 * LLM-free — the board must be instant. Offers are spread across as many
 * DIFFERENT templates as possible (one slot per mission type before any
 * repeats), so every mission line shows up on the board.
 */
export class JobOfferBuilder {
  static buildOffers(
    context: EnginePlayerContext,
    boardSeed: string,
    templates: MissionTemplate[],
    engine: EngineConfig,
  ): JobOffer[] {
    const rng = new MissionRng(boardSeed, "board");
    const all = this.eligibleTemplates(context, templates, engine);
    // Lay-low work is always on offer — it's the reliable way to shed
    // heat — so it gets a guaranteed extra slot instead of competing.
    const layLow = all.filter((t) => t.type === "lay_low");
    const eligible = all.filter((t) => t.type !== "lay_low");

    // Fill the slots template-by-template, cycling when there are fewer
    // templates than slots; a template repeated twice gets distinct seeds.
    const order = rng.pickDistinct(eligible, eligible.length, "templates");
    const slots = Array.from(
      { length: order.length === 0 ? 0 : engine.board.size },
      (_, index) => order[index % order.length]!,
    );
    slots.push(...layLow);

    const slotCounts = new Map<string, number>();
    for (const template of slots) {
      slotCounts.set(template.id, (slotCounts.get(template.id) ?? 0) + 1);
    }
    const seedsByTemplate = new Map(
      [...slotCounts].map(([id, count]) => {
        const template = slots.find((t) => t.id === id)!;
        return [
          id,
          rng.pickDistinct(template.storySeeds, count, `seeds:${id}`),
        ];
      }),
    );

    const seedsUsed = new Map<string, number>();

    return slots.map((template, index) => {
      const used = seedsUsed.get(template.id) ?? 0;
      seedsUsed.set(template.id, used + 1);
      const storySeed = seedsByTemplate.get(template.id)![used]!;
      const calculations = JobCalculatorService.calculate(
        context,
        template,
        engine,
      );

      return {
        difficulty: calculations.difficulty,
        district: template.district,
        gear: (template.gear ?? []).map((entry) => ({
          consumes: entry.consumes,
          label: entry.label,
          tags: entry.tags,
        })),
        heatIncrease: calculations.heatIncrease,
        id: `${boardSeed.slice(0, 12)}-${index}`,
        rewardMax: calculations.rewardMax,
        rewardMin: calculations.rewardMin,
        staminaCost: JobCalculatorService.staminaCost(
          template,
          calculations.difficulty,
          engine,
        ),
        storySeed,
        templateId: template.id,
        type: template.type,
      };
    });
  }

  /**
   * Jobs written for the player's level: the band opens at levels.min and
   * stays on the board until the player outgrows it by board.levelGrace.
   * If nothing matches (bad data, capped player), the nearest bands fill
   * in so the board is never empty.
   */
  private static eligibleTemplates(
    context: EnginePlayerContext,
    templates: MissionTemplate[],
    engine: EngineConfig,
  ): MissionTemplate[] {
    const eligible = templates.filter(
      (t) =>
        context.level >= t.levels.min &&
        context.level <= t.levels.max + engine.board.levelGrace,
    );
    if (eligible.length > 0) {
      return eligible;
    }

    const distance = (t: MissionTemplate) =>
      Math.min(
        Math.abs(context.level - t.levels.min),
        Math.abs(context.level - t.levels.max),
      );
    return [...templates].sort((a, b) => distance(a) - distance(b)).slice(0, 3);
  }
}
