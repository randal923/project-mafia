import type { SkillExperienceSummary } from "@shared/job";
import { SKILL_IDS, SKILLS } from "@shared/skills";
import { displayText, typography } from "../../design-system/typography";

type MissionSkillExperienceSummaryProps = {
  summary: SkillExperienceSummary;
};

export function MissionSkillExperienceSummary({
  summary,
}: MissionSkillExperienceSummaryProps) {
  const gains = SKILL_IDS.flatMap((skill) => {
    const xp = summary[skill] ?? 0;
    return xp > 0 ? [{ skill, xp }] : [];
  });

  return (
    <section
      aria-label="Skill experience earned"
      className="flex flex-col gap-3 border-t border-line pt-4"
    >
      <h3 className={`m-0 ${displayText} text-2xl text-title`}>
        Skill experience earned
      </h3>
      {gains.length > 0 ? (
        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          {gains.map(({ skill, xp }) => (
            <div
              className="flex items-baseline justify-between gap-4 rounded-control border border-line bg-black/30 px-3 py-2"
              key={skill}
            >
              <dt className={typography.metadata}>{SKILLS[skill].label}</dt>
              <dd className={`m-0 ${displayText} text-xl text-brass-bright`}>
                +{xp} XP
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={`m-0 ${typography.paragraph}`}>
          No skill experience gained on this job.
        </p>
      )}
    </section>
  );
}
