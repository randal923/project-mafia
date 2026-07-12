import type { SkillExperienceSummary } from "@shared/job";
import { SKILL_IDS } from "@shared/skills";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { useCatalogText } from "../../lib/useCatalogText";

type MissionSkillExperienceSummaryProps = {
  summary: SkillExperienceSummary;
};

export function MissionSkillExperienceSummary({
  summary,
}: MissionSkillExperienceSummaryProps) {
  const t = useTranslations("mission.skillXp");
  const { skillName } = useCatalogText();
  const gains = SKILL_IDS.flatMap((skill) => {
    const xp = summary[skill] ?? 0;
    return xp > 0 ? [{ skill, xp }] : [];
  });

  return (
    <section
      aria-label={t("title")}
      className="flex flex-col gap-3 border-t border-line pt-4"
    >
      <h3 className={`m-0 ${displayText} text-2xl text-title`}>
        {t("title")}
      </h3>
      {gains.length > 0 ? (
        <dl className="m-0 grid gap-3 sm:grid-cols-2">
          {gains.map(({ skill, xp }) => (
            <div
              className="flex items-baseline justify-between gap-4 rounded-control border border-line bg-black/30 px-3 py-2"
              key={skill}
            >
              <dt className={typography.metadata}>{skillName(skill)}</dt>
              <dd className={`m-0 ${displayText} text-xl text-brass-bright`}>
                {t("gain", { xp })}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={`m-0 ${typography.paragraph}`}>{t("none")}</p>
      )}
    </section>
  );
}
