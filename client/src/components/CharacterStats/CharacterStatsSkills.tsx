import {
  MAX_PLAYER_LEVEL,
  MAX_SKILL_LEVEL,
  SKILL_XP_PER_LEVEL,
  xpToNextLevel
} from "@shared/leveling";
import { SKILLS, SKILL_IDS } from "@shared/skills";
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

  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Progression">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CharacterStatsTile
              label="Level"
              tone={atLevelCap ? "brassBright" : "ink"}
              value={`${numberFormatter.format(progression.level)} / ${MAX_PLAYER_LEVEL}`}
            />
            <CharacterStatsTile
              label="Experience"
              value={
                atLevelCap
                  ? "At the top"
                  : `${numberFormatter.format(progression.experience)} / ${numberFormatter.format(xpNeeded)}`
              }
            />
          </div>
          {!atLevelCap ? (
            <CharacterStatsMeter
              label="Next level"
              max={xpNeeded}
              tone="brass"
              value={progression.experience}
              valueLabel={`${Math.floor((progression.experience / xpNeeded) * 100)}%`}
            />
          ) : null}
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Skills">
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          {SKILL_IDS.map((id) => {
            const level = progression.skills[id];
            const xp = progression.skillExperience[id];
            const capped = level >= MAX_SKILL_LEVEL;

            return (
              <CharacterStatsMeter
                hint={SKILLS[id].description}
                key={id}
                label={SKILLS[id].label}
                max={MAX_SKILL_LEVEL}
                tone="brass"
                value={level}
                valueLabel={
                  capped
                    ? `${level} / ${MAX_SKILL_LEVEL} · mastered`
                    : `${level} / ${MAX_SKILL_LEVEL} · ${numberFormatter.format(xp)}/${SKILL_XP_PER_LEVEL} xp`
                }
              />
            );
          })}
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
