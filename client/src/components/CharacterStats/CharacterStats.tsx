import { cx } from "../../lib/cx";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { formatIdentifier } from "./CharacterStatsFormat";
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
  ariaLabel = "Character stats",
  className,
  profile
}: CharacterStatsProps) {
  const classNames = cx(
    "w-full rounded-panel border border-line bg-surface shadow-panel",
    className
  );

  return (
    <section aria-label={ariaLabel} className={classNames}>
      <SectionHeader
        aside={`Level ${profile.progression.level}`}
        eyebrow={formatIdentifier(profile.rank)}
        title={profile.name}
      />
      <div className="divide-y divide-line">
        <div className="p-6">
          <CharacterStatsGroup label="Overview">
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
