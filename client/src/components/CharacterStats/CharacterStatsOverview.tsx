import { calculatePlayerPower } from "@shared/playerPower";
import { moneyFormatter, numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { Player } from "./CharacterStatsTypes";

type CharacterStatsOverviewProps = {
  player: Player;
};

export function CharacterStatsOverview({ player }: CharacterStatsOverviewProps) {
  const { resources } = player;

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
            value={numberFormatter.format(calculatePlayerPower(player))}
          />
          <CharacterStatsTile
            label="Heat"
            tone="danger"
            value={`${numberFormatter.format(resources.heat)} / 100`}
          />
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
