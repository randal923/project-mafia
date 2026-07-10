"use client";

import { useState, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { Tabs, tabDomId, tabPanelDomId, type TabDefinition } from "../Tabs/Tabs";
import { formatIdentifier } from "./CharacterStatsFormat";
import { CharacterStatsOverview } from "./CharacterStatsOverview";
import { CharacterStatsSkills } from "./CharacterStatsSkills";
import type { Player } from "./CharacterStatsTypes";

export type CharacterStatsTabId = "overview" | "skills";

type CharacterStatsProps = {
  ariaLabel?: string;
  className?: string;
  initialTabId?: CharacterStatsTabId;
  profile: Player;
};

const idPrefix = "character-stats";

const tabs: readonly TabDefinition<CharacterStatsTabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Skills" }
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
    overview: <CharacterStatsOverview player={profile} />,
    skills: <CharacterStatsSkills progression={profile.progression} />
  };

  return (
    <section aria-label={ariaLabel} className={classNames}>
      <SectionHeader
        aside={`Level ${profile.progression.level}`}
        eyebrow={formatIdentifier(profile.rank)}
        title={profile.name}
      />
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
