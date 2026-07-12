import { intoxicationPenalty } from "@shared/intoxication";
import { MAX_HEALTH } from "@shared/health";
import { MAX_HEAT, MAX_STAMINA } from "@shared/player";
import { calculatePlayerPower } from "@shared/playerPower";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("character");

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label={t("groups.resources")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CharacterStatsTile
            label={t("tiles.cash")}
            tone="profit"
            value={moneyFormatter.format(resources.cash)}
          />
          <CharacterStatsTile
            label={t("tiles.power")}
            tone="brass"
            value={numberFormatter.format(calculatePlayerPower(player))}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label={t("groups.condition")}>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <CharacterStatsMeter
            hint={t("meters.health.hint")}
            label={t("meters.health.label")}
            max={MAX_HEALTH}
            tone="teal"
            value={resources.health}
            valueLabel={`${resources.health} / ${MAX_HEALTH}`}
          />
          <CharacterStatsMeter
            hint={t("meters.stamina.hint")}
            label={t("meters.stamina.label")}
            max={MAX_STAMINA}
            tone="brass"
            value={resources.stamina}
            valueLabel={`${resources.stamina} / ${MAX_STAMINA}`}
          />
          <CharacterStatsMeter
            hint={t("meters.heat.hint")}
            label={t("meters.heat.label")}
            max={MAX_HEAT}
            tone="danger"
            value={resources.heat}
            valueLabel={`${resources.heat} / ${MAX_HEAT}`}
          />
          <CharacterStatsMeter
            hint={t("meters.high.hint")}
            label={t("meters.high.label")}
            max={100}
            tone="teal"
            value={resources.high}
            valueLabel={`${resources.high} / 100`}
          />
          <CharacterStatsMeter
            hint={t("meters.drunk.hint")}
            label={t("meters.drunk.label")}
            max={100}
            tone="profit"
            value={resources.drunk}
            valueLabel={`${resources.drunk} / 100`}
          />
        </div>
        {impairment > 0 ? (
          <p className={`m-0 mt-4 ${typography.metadata}`}>
            {t("impaired", { penalty: impairment })}
          </p>
        ) : null}
      </CharacterStatsGroup>
    </div>
  );
}
