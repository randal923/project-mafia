import { intoxicationPenalty } from "@shared/intoxication";
import { MAX_HEALTH } from "@shared/health";
import { MAX_HEAT, MAX_STAMINA } from "@shared/player";
import { calculatePlayerPower } from "@shared/playerPower";
import { typography } from "../../design-system/typography";
import { moneyFormatter, numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { Player } from "./CharacterStatsTypes";

type CharacterStatsOverviewProps = {
  player: Player;
};

export function CharacterStatsOverview({ player }: CharacterStatsOverviewProps) {
  const { resources } = player;
  const impairment = intoxicationPenalty(resources.high, resources.drunk);

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
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Condition">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <CharacterStatsMeter
            hint="Physical condition. Failed risky choices can cause damage; armor absorbs part of the hit, while kits and rest restore Health."
            label="Health"
            max={MAX_HEALTH}
            tone="teal"
            value={resources.health}
            valueLabel={`${resources.health} / ${MAX_HEALTH}`}
          />
          <CharacterStatsMeter
            hint="Energy for jobs — each contract costs some. Regenerates 25 per hour while you rest; drugs and liquor refill it faster, at a price."
            label="Stamina"
            max={MAX_STAMINA}
            tone="brass"
            value={resources.stamina}
            valueLabel={`${resources.stamina} / ${MAX_STAMINA}`}
          />
          <CharacterStatsMeter
            hint="Police attention. Raises every check's difficulty on jobs. Cools 4 per idle hour — or faster via precinct bribes, lay-low work, and doing prison time."
            label="Heat"
            max={MAX_HEAT}
            tone="danger"
            value={resources.heat}
            valueLabel={`${resources.heat} / ${MAX_HEAT}`}
          />
          <CharacterStatsMeter
            hint="How high you are. −1% on every job check per 10 points, and drugs restore less stamina the higher you already are. Sobers off 20 per idle hour."
            label="High"
            max={100}
            tone="teal"
            value={resources.high}
            valueLabel={`${resources.high} / 100`}
          />
          <CharacterStatsMeter
            hint="How drunk you are. −1% on every job check per 10 points, and liquor restores less stamina the drunker you already are. Sobers off 20 per idle hour."
            label="Drunk"
            max={100}
            tone="profit"
            value={resources.drunk}
            valueLabel={`${resources.drunk} / 100`}
          />
        </div>
        {impairment > 0 ? (
          <p className={`m-0 mt-4 ${typography.metadata}`}>
            Impaired: −{impairment}% on every job check until you sober up.
            Doses also restore less stamina while the buzz lasts.
          </p>
        ) : null}
      </CharacterStatsGroup>
    </div>
  );
}
