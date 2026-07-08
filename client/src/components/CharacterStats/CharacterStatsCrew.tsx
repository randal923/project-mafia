import { numberFormatter } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTile } from "./CharacterStatsTile";
import type { CrewSpecialists, PlayerCrew } from "./CharacterStatsTypes";

type CharacterStatsCrewProps = {
  crew: PlayerCrew;
};

type CrewStatKey = "discipline" | "intelligence" | "loyalty" | "muscle";

const crewStatMax = 10;

const crewStatOrder: readonly { key: CrewStatKey; label: string }[] = [
  { key: "muscle", label: "Muscle" },
  { key: "intelligence", label: "Intelligence" },
  { key: "loyalty", label: "Loyalty" },
  { key: "discipline", label: "Discipline" }
];

const specialistOrder: readonly {
  key: keyof CrewSpecialists;
  label: string;
}[] = [
  { key: "enforcers", label: "Enforcers" },
  { key: "drivers", label: "Drivers" },
  { key: "fixers", label: "Fixers" },
  { key: "hackers", label: "Hackers" },
  { key: "negotiators", label: "Negotiators" }
];

export function CharacterStatsCrew({ crew }: CharacterStatsCrewProps) {
  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Members">
        <div className="grid gap-4 sm:grid-cols-3">
          <CharacterStatsTile
            label="Total"
            value={numberFormatter.format(crew.totalMembers)}
          />
          <CharacterStatsTile
            label="Available"
            tone="profit"
            value={numberFormatter.format(crew.availableMembers)}
          />
          <CharacterStatsTile
            label="Wounded"
            tone={crew.woundedMembers > 0 ? "danger" : "ink"}
            value={numberFormatter.format(crew.woundedMembers)}
          />
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Crew Strength">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {crewStatOrder.map((stat) => (
            <CharacterStatsMeter
              key={stat.key}
              label={stat.label}
              max={crewStatMax}
              tone="brass"
              value={crew[stat.key]}
              valueLabel={`${crew[stat.key]} / ${crewStatMax}`}
            />
          ))}
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Specialists">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {specialistOrder.map((specialist) => (
            <CharacterStatsTile
              key={specialist.key}
              label={specialist.label}
              tone={crew.specialists[specialist.key] > 0 ? "ink" : "muted"}
              value={numberFormatter.format(crew.specialists[specialist.key])}
            />
          ))}
        </div>
      </CharacterStatsGroup>
    </div>
  );
}
