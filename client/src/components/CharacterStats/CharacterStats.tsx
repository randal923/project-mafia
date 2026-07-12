import { useTranslations } from "next-intl";
import { cx } from "../../lib/cx";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsOverview } from "./CharacterStatsOverview";
import { CharacterStatsSkills } from "./CharacterStatsSkills";
import type { Player } from "./CharacterStatsTypes";

type CharacterStatsProps = {
  ariaLabel?: string;
  className?: string;
  profile: Player;
};

export function CharacterStats({
  ariaLabel,
  className,
  profile
}: CharacterStatsProps) {
  const t = useTranslations("character");
  const classNames = cx(
    "w-full rounded-panel border border-line bg-surface shadow-panel",
    className
  );

  return (
    <section aria-label={ariaLabel ?? t("stats.ariaLabel")} className={classNames}>
      <SectionHeader
        aside={t("stats.level", { level: profile.progression.level })}
        eyebrow={t(`ranks.${profile.rank}`)}
        title={profile.name}
      />
      <div className="divide-y divide-line">
        <div className="p-6">
          <CharacterStatsGroup label={t("groups.overview")}>
            <CharacterStatsOverview player={profile} />
          </CharacterStatsGroup>
        </div>
        <div className="p-6">
          <CharacterStatsSkills progression={profile.progression} />
        </div>
      </div>
    </section>
  );
}
