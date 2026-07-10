import { numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { PlayerProgression, PlayerSkills } from "./CharacterStatsTypes";

type CharacterStatsSkillsProps = {
  progression: PlayerProgression;
};

const skillMax = 10;

const skillOrder: readonly { key: keyof PlayerSkills; label: string }[] = [
  { key: "muscle", label: "Muscle" },
  { key: "strategy", label: "Strategy" },
  { key: "corruption", label: "Corruption" },
  { key: "stealth", label: "Stealth" },
  { key: "business", label: "Business" },
  { key: "leadership", label: "Leadership" }
];

export function CharacterStatsSkills({
  progression
}: CharacterStatsSkillsProps) {
  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Progression">
        <div className="grid gap-4 sm:grid-cols-3">
          <CharacterStatsTile
            label="Level"
            value={numberFormatter.format(progression.level)}
          />
          <CharacterStatsTile
            label="Experience"
            value={numberFormatter.format(progression.experience)}
          />
          <CharacterStatsTile
            label="Skill Points"
            tone={progression.skillPoints > 0 ? "brassBright" : "ink"}
            value={numberFormatter.format(progression.skillPoints)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Skills">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {skillOrder.map((skill) => (
            <CharacterStatsMeter
              key={skill.key}
              label={skill.label}
              max={skillMax}
              tone="brass"
              value={progression.skills[skill.key]}
              valueLabel={`${progression.skills[skill.key]} / ${skillMax} · ${numberFormatter.format(progression.skillExperience[skill.key])} xp`}
            />
          ))}
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
