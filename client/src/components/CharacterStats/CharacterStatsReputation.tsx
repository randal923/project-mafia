import type { BackgroundTone } from "../../design-system/tones";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { formatSigned } from "./CharacterStatsFormat";
import { CharacterStatsGroup } from "./CharacterStatsGroup";
import { CharacterStatsMeter } from "./CharacterStatsMeter";
import { CharacterStatsTagList } from "./CharacterStatsTagList";
import type {
  PlayerRelationship,
  PlayerReputation
} from "./CharacterStatsTypes";

type CharacterStatsReputationProps = {
  relationships: readonly PlayerRelationship[];
  reputation: PlayerReputation;
};

type ReputationKey = Exclude<keyof PlayerReputation, "knownFor">;

const reputationMax = 100;

const reputationOrder: readonly {
  key: ReputationKey;
  label: string;
  tone: BackgroundTone;
}[] = [
  { key: "respect", label: "Respect", tone: "brass" },
  { key: "fear", label: "Fear", tone: "danger" },
  { key: "loyalty", label: "Loyalty", tone: "brass" },
  { key: "reliability", label: "Reliability", tone: "brass" },
  { key: "ambition", label: "Ambition", tone: "teal" },
  { key: "brutality", label: "Brutality", tone: "danger" },
  { key: "betrayal", label: "Betrayal", tone: "danger" }
];

export function CharacterStatsReputation({
  relationships,
  reputation
}: CharacterStatsReputationProps) {
  return (
    <div className="flex flex-col gap-6">
      <CharacterStatsGroup label="Street Reputation">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {reputationOrder.map((entry) => (
            <CharacterStatsMeter
              key={entry.key}
              label={entry.label}
              max={reputationMax}
              tone={entry.tone}
              value={reputation[entry.key]}
            />
          ))}
        </div>
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Known For">
        <CharacterStatsTagList
          emptyLabel="No reputation earned yet."
          labels={reputation.knownFor}
        />
      </CharacterStatsGroup>
      <CharacterStatsGroup label="Relationships">
        {relationships.length === 0 ? (
          <p className={`m-0 ${typography.paragraph}`}>
            Nobody important knows this name yet.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {relationships.map((relationship) => (
              <li
                className="flex items-center justify-between gap-4 rounded-control border border-line bg-surface-raised px-4 py-3"
                key={relationship.id}
              >
                <span className={`${displayText} text-xl text-ink`}>
                  {relationship.name}
                </span>
                <span
                  className={cx(
                    `${displayText} text-xl`,
                    relationship.standing >= 0
                      ? "text-profit"
                      : "text-danger-strong"
                  )}
                >
                  {formatSigned(relationship.standing)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CharacterStatsGroup>
    </div>
  );
}
