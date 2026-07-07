import type { Player } from "../../../models/player";
import { calculatePlayerPower } from "../../../player/lib/calculatePlayerPower";
import type { PlayerPromptContext } from "../types";

export function createPlayerPromptContext(
  player: Player,
): PlayerPromptContext {
  return {
    activeStoryThreads: player.narrative.activeStoryThreads
      .slice(-5)
      .map(
        ({
          possibleNextBeats,
          relatedDistrictIds,
          relatedFactionIds,
          summary,
          tension,
          title,
        }) => ({
          possibleNextBeats,
          relatedDistrictIds,
          relatedFactionIds,
          summary,
          tension,
          title,
        }),
      ),
    effectivePower: calculatePlayerPower(player),
    heat: player.resources.heat,
    importantFacts: player.narrative.llmMemory.importantFacts,
    majorEvents: player.narrative.majorEvents
      .slice(-5)
      .map(({ districtId, relatedFactionIds, summary, title, type }) => ({
        districtId,
        relatedFactionIds,
        summary,
        title,
        type,
      })),
    money: {
      clean: player.resources.cleanMoney,
      dirty: player.resources.dirtyMoney,
    },
    name: "you",
    preferredJobThemes: player.narrative.llmMemory.preferredJobThemes,
    rank: player.rank,
    storySummary: player.narrative.storySummary,
    unresolvedConflicts: player.narrative.llmMemory.unresolvedConflicts,
  };
}
