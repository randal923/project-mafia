import { typography } from "../../design-system/typography";
import { formatIdentifier } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsList } from "./CharacterStatsList";
import { CharacterStatsTagList } from "./CharacterStatsTagList";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerNarrative } from "./CharacterStatsTypes";

type CharacterStatsStoryProps = {
  narrative: PlayerNarrative;
};

export function CharacterStatsStory({ narrative }: CharacterStatsStoryProps) {
  const { llmMemory, personality } = narrative;

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <CharacterStatsTile
            label="Origin"
            size="medium"
            value={formatIdentifier(narrative.origin)}
          />
          <CharacterStatsTile
            label="Style"
            size="medium"
            value={formatIdentifier(personality.style)}
          />
          <CharacterStatsTile
            label="Moral Code"
            size="medium"
            value={formatIdentifier(personality.moralCode)}
          />
          <CharacterStatsTile
            label="Approach"
            size="medium"
            value={formatIdentifier(personality.preferredApproach)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Story So Far">
        <p className={`m-0 ${typography.narrativeBody}`}>
          {narrative.storySummary}
        </p>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Major Events">
        <CharacterStatsList
          emptyLabel="Nothing worth retelling yet."
          items={narrative.majorEvents}
        />
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Active Threads">
        <CharacterStatsList
          emptyLabel="No open storylines."
          items={narrative.activeStoryThreads}
        />
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Word On The Street">
        <CharacterStatsList
          emptyLabel="Nobody is talking yet."
          items={llmMemory.importantFacts}
        />
      </CharacterStatsGroup>
      {llmMemory.recurringCharacters.length > 0 ? (
        <CharacterStatsGroup label="Recurring Characters">
          <CharacterStatsList emptyLabel="" items={llmMemory.recurringCharacters} />
        </CharacterStatsGroup>
      ) : null}
      {llmMemory.unresolvedConflicts.length > 0 ? (
        <CharacterStatsGroup label="Unresolved Conflicts">
          <CharacterStatsList emptyLabel="" items={llmMemory.unresolvedConflicts} />
        </CharacterStatsGroup>
      ) : null}
      <CharacterStatsGroup label="Preferred Jobs">
        <CharacterStatsTagList
          emptyLabel="No preferred line of work."
          labels={llmMemory.preferredJobThemes}
        />
      </CharacterStatsGroup>
    </div>
  );
}
