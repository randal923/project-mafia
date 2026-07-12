import {
  MAX_PLAYER_LEVEL,
  MAX_SKILL_LEVEL,
  SKILL_XP_PER_LEVEL,
  xpToNextLevel
} from "@shared/leveling";
import { SKILL_IDS } from "@shared/skills";
import { useTranslations } from "next-intl";
import { numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerProgression } from "./CharacterStatsTypes";

type CharacterStatsSkillsProps = {
  progression: PlayerProgression;
};

export function CharacterStatsSkills({
  progression
}: CharacterStatsSkillsProps) {
  const atLevelCap = progression.level >= MAX_PLAYER_LEVEL;
  const xpNeeded = xpToNextLevel(progression.level);
  const t = useTranslations("character");

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label={t("groups.progression")}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CharacterStatsTile
              label={t("tiles.level")}
              tone={atLevelCap ? "brassBright" : "ink"}
              value={`${numberFormatter.format(progression.level)} / ${MAX_PLAYER_LEVEL}`}
            />
            <CharacterStatsTile
              label={t("tiles.experience")}
              value={
                atLevelCap
                  ? t("progression.atTheTop")
                  : `${numberFormatter.format(progression.experience)} / ${numberFormatter.format(xpNeeded)}`
              }
            />
          </div>
          {!atLevelCap ? (
            <CharacterStatsMeter
              label={t("progression.nextLevel")}
              max={xpNeeded}
              tone="brass"
              value={progression.experience}
              valueLabel={`${Math.floor((progression.experience / xpNeeded) * 100)}%`}
            />
          ) : null}
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label={t("groups.skills")}>
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          {SKILL_IDS.map((id) => {
            const level = progression.skills[id];
            const xp = progression.skillExperience[id];
            const capped = level >= MAX_SKILL_LEVEL;

            return (
              <CharacterStatsMeter
                hint={t(`skills.${id}.description`)}
                key={id}
                label={t(`skills.${id}.label`)}
                max={MAX_SKILL_LEVEL}
                tone="brass"
                value={level}
                valueLabel={
                  capped
                    ? t("skillMeter.mastered", { level, max: MAX_SKILL_LEVEL })
                    : t("skillMeter.progress", {
                        level,
                        max: MAX_SKILL_LEVEL,
                        xp,
                        xpPerLevel: SKILL_XP_PER_LEVEL
                      })
                }
              />
            );
          })}
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
