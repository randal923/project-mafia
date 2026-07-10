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

    // Fill the slots template-by-template, cycling when there are fewer
    // templates than slots; a template repeated twice gets distinct seeds.
    const order = rng.pickDistinct(templates, templates.length, "templates");
    const slots = Array.from(
      { length: engine.board.size },
      (_, index) => order[index % order.length]!,
    );

    const slotCounts = new Map<string, number>();
    for (const template of slots) {
      slotCounts.set(template.id, (slotCounts.get(template.id) ?? 0) + 1);
    }
    const seedsByTemplate = new Map(
      [...slotCounts].map(([id, count]) => {
        const template = order.find((t) => t.id === id)!;
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
        heatIncrease: calculations.heatIncrease,
        id: `${boardSeed.slice(0, 12)}-${index}`,
        rewardMax: calculations.rewardMax,
        rewardMin: calculations.rewardMin,
        storySeed,
        templateId: template.id,
        type: template.type,
      };
    });
  }
}
