"use client";

import { useRef, type KeyboardEvent } from "react";
import { displayText } from "../../design-system/typography";
import { cx } from "../../lib/cx";

export type TabDefinition<TabId extends string> = {
  id: TabId;
  label: string;
};

type TabsProps<TabId extends string> = {
  activeTabId: TabId;
  ariaLabel: string;
  idPrefix: string;
  onTabChange: (tabId: TabId) => void;
  tabs: readonly TabDefinition<TabId>[];
};

export function tabDomId(idPrefix: string, tabId: string) {
  return `${idPrefix}-tab-${tabId}`;
}

export function tabPanelDomId(idPrefix: string, tabId: string) {
  return `${idPrefix}-panel-${tabId}`;
}

export function Tabs<TabId extends string>({
  activeTabId,
  ariaLabel,
  idPrefix,
  onTabChange,
  tabs
}: TabsProps<TabId>) {
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    const nextTab = tabs[(activeIndex + offset + tabs.length) % tabs.length];
    onTabChange(nextTab.id);
    tabRefs.current.get(nextTab.id)?.focus();
  };

  return (
    <div
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2 border-b border-line px-4 py-3"
      onKeyDown={handleKeyDown}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const classNames = cx(
          `inline-flex min-h-10 cursor-pointer items-center rounded-control border px-4 py-2 ${displayText} text-lg transition-[background-color,border-color,color] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright`,
          isActive
            ? "border-brass bg-brass/10 text-ink"
            : "border-transparent bg-transparent text-muted hover:border-line hover:text-ink"
        );

        return (
          <button
            aria-controls={tabPanelDomId(idPrefix, tab.id)}
            aria-selected={isActive}
            className={classNames}
            id={tabDomId(idPrefix, tab.id)}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            ref={(element) => {
              if (element) {
                tabRefs.current.set(tab.id, element);
              } else {
                tabRefs.current.delete(tab.id);
              }
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
