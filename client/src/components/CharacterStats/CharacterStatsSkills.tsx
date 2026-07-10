import {
  MAX_PLAYER_LEVEL,
  MAX_SKILL_LEVEL,
  SKILL_XP_PER_LEVEL,
  xpToNextLevel
} from "@shared/leveling";
import { numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerProgression, PlayerSkills } from "./CharacterStatsTypes";

type CharacterStatsSkillsProps = {
  progression: PlayerProgression;
};

const skillOrder: readonly { key: keyof PlayerSkills; label: string }[] = [
  { key: "muscle", label: "Muscle" },
  { key: "strategy", label: "Strategy" },
  { key: "corruption", label: "Corruption" },
  { key: "stealth", label: "Stealth" },
  { key: "tech", label: "Tech" },
  { key: "leadership", label: "Leadership" }
];

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
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {skillOrder.map((skill) => {
            const level = progression.skills[skill.key];
            const xp = progression.skillExperience[skill.key];
            const capped = level >= MAX_SKILL_LEVEL;

            return (
              <CharacterStatsMeter
                key={skill.key}
                label={skill.label}
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
