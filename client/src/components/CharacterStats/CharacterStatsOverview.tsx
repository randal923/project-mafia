import { moneyFormatter, numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerResources } from "./CharacterStatsTypes";

type CharacterStatsOverviewProps = {
  resources: PlayerResources;
};

const heatMax = 100;
const highHeatRatio = 0.6;

export function CharacterStatsOverview({
  resources
}: CharacterStatsOverviewProps) {
  const heatTone =
    resources.heat >= heatMax * highHeatRatio ? "danger" : "brass";

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Money">
        <div className="grid gap-4 sm:grid-cols-3">
          <CharacterStatsTile
            label="Total"
            value={moneyFormatter.format(resources.money)}
          />
          <CharacterStatsTile
            label="Clean"
            tone="profit"
            value={moneyFormatter.format(resources.cleanMoney)}
          />
          <CharacterStatsTile
            label="Dirty"
            tone="danger"
            value={moneyFormatter.format(resources.dirtyMoney)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Standing">
        <div className="grid gap-4 sm:grid-cols-2">
          <CharacterStatsTile
            label="Influence"
            tone="brass"
            value={numberFormatter.format(resources.influence)}
          />
          <CharacterStatsTile
            label="Power"
            tone="brass"
            value={numberFormatter.format(resources.power)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Condition">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <CharacterStatsMeter
            label="Heat"
            max={heatMax}
            tone={heatTone}
            value={resources.heat}
          />
          <CharacterStatsMeter
            label="Action Points"
            max={resources.maxActionPoints}
            tone="teal"
            value={resources.actionPoints}
            valueLabel={`${resources.actionPoints} / ${resources.maxActionPoints}`}
          />
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
