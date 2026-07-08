import { formatIdentifier, numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTagList } from "./CharacterStatsTagList";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerTerritory } from "./CharacterStatsTypes";

type CharacterStatsTerritoryProps = {
  territory: PlayerTerritory;
};

const districtInfluenceMax = 10;

export function CharacterStatsTerritory({
  territory
}: CharacterStatsTerritoryProps) {
  const influenceEntries = Object.entries(territory.districtInfluence).sort(
    ([, first], [, second]) => second - first
  );

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Holdings">
        <div className="grid gap-4 sm:grid-cols-2">
          <CharacterStatsTile
            label="Businesses"
            value={numberFormatter.format(territory.businessesOwned)}
          />
          <CharacterStatsTile
            label="Safehouses"
            value={numberFormatter.format(territory.safehousesOwned)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Controlled Districts">
        <CharacterStatsTagList
          emptyLabel="No districts under control."
          labels={territory.controlledDistrictIds.map(formatIdentifier)}
        />
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Contested Districts">
        <CharacterStatsTagList
          emptyLabel="No active turf disputes."
          labels={territory.contestedDistrictIds.map(formatIdentifier)}
        />
      </CharacterStatsGroup>
      <CharacterStatsGroup label="District Influence">
        {influenceEntries.length === 0 ? (
          <CharacterStatsTagList emptyLabel="No influence anywhere yet." labels={[]} />
        ) : (
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {influenceEntries.map(([districtId, influence]) => (
              <CharacterStatsMeter
                key={districtId}
                label={formatIdentifier(districtId)}
                max={districtInfluenceMax}
                tone="teal"
                value={influence}
                valueLabel={`${influence} / ${districtInfluenceMax}`}
              />
            ))}
          </div>
        )}
      </CharacterStatsGroup>
    </div>
  );
}
