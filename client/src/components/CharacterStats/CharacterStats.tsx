"use client";

import { useState, type ReactNode } from "react";
import { typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { Tabs, tabDomId, tabPanelDomId, type TabDefinition } from "../Tabs/Tabs";
import { Tag } from "../Tag/Tag";
import { CharacterStatsCrew } from "./CharacterStatsCrew";
import { formatIdentifier } from "./CharacterStatsFormat";
import { CharacterStatsOverview } from "./CharacterStatsOverview";
import { CharacterStatsReputation } from "./CharacterStatsReputation";
import { CharacterStatsSkills } from "./CharacterStatsSkills";
import { CharacterStatsStory } from "./CharacterStatsStory";
import { CharacterStatsTerritory } from "./CharacterStatsTerritory";
import type { PlayerProfile } from "./CharacterStatsTypes";

export type CharacterStatsTabId =
  | "crew"
  | "overview"
  | "reputation"
  | "skills"
  | "story"
  | "territory";

type CharacterStatsProps = {
  ariaLabel?: string;
  className?: string;
  initialTabId?: CharacterStatsTabId;
  profile: PlayerProfile;
};

const idPrefix = "character-stats";

const tabs: readonly TabDefinition<CharacterStatsTabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Skills" },
  { id: "reputation", label: "Reputation" },
  { id: "crew", label: "Crew" },
  { id: "territory", label: "Territory" },
  { id: "story", label: "Story" }
];

export function CharacterStats({
  ariaLabel = "Character stats",
  className,
  initialTabId = "overview",
  profile
}: CharacterStatsProps) {
  const [activeTabId, setActiveTabId] =
    useState<CharacterStatsTabId>(initialTabId);
  const classNames = cx(
    "w-full rounded-panel border border-line bg-surface shadow-panel",
    className
  );

  const panels: Record<CharacterStatsTabId, ReactNode> = {
    crew: <CharacterStatsCrew crew={profile.crew} />,
    overview: <CharacterStatsOverview resources={profile.resources} />,
    reputation: (
      <CharacterStatsReputation
        relationships={profile.relationships}
        reputation={profile.reputation}
      />
    ),
    skills: <CharacterStatsSkills progression={profile.progression} />,
    story: <CharacterStatsStory narrative={profile.narrative} />,
    territory: <CharacterStatsTerritory territory={profile.territory} />
  };

  return (
    <section aria-label={ariaLabel} className={classNames}>
      <SectionHeader
        aside={`Level ${profile.progression.level}`}
        eyebrow={formatIdentifier(profile.rank)}
        title={profile.name}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className={`m-0 ${typography.subtitle}`}>{profile.title}</p>
        <Tag label={formatIdentifier(profile.status)} />
      </div>
      <Tabs
        activeTabId={activeTabId}
        ariaLabel="Character stat categories"
        idPrefix={idPrefix}
        onTabChange={setActiveTabId}
        tabs={tabs}
      />
      <div
        aria-labelledby={tabDomId(idPrefix, activeTabId)}
        className="p-4"
        id={tabPanelDomId(idPrefix, activeTabId)}
        role="tabpanel"
      >
        {panels[activeTabId]}
      </div>
    </section>
  );
}
