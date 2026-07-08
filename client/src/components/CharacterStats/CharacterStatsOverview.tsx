import { moneyFormatter, numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerResources } from "./CharacterStatsTypes";

type CharacterStatsOverviewProps = {
  resources: PlayerResources;
};

export function CharacterStatsOverview({
  resources
}: CharacterStatsOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Resources">
        <div className="grid gap-4 sm:grid-cols-2">
          <CharacterStatsTile
            label="Cash"
            tone="profit"
            value={moneyFormatter.format(resources.cash)}
          />
          <CharacterStatsTile
            label="Power"
            tone="brass"
            value={numberFormatter.format(resources.power)}
          />
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
