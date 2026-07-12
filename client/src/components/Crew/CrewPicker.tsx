"use client";

import {
  CREW_ARCHETYPES,
  CREW_TIER_LABELS,
  crewCheckBonus,
  crewMemberPower,
  type CrewMember,
} from "@shared/crew";
import { useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";

type CrewPickerProps = {
  capacity: number;
  /** Idle members available to bring. */
  crew: CrewMember[];
  intro: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: (crewIds: string[]) => void;
  /** Label for the confirm button, e.g. "Take the job". */
  confirmLabel: string;
  title: string;
};

/**
 * Pick who comes along. Used for job accepts, turf takeovers, and
 * assaults — anywhere soldiers ride with you.
 */
export function CrewPicker({
  capacity,
  confirmLabel,
  crew,
  intro,
  isBusy,
  onCancel,
  onConfirm,
  title,
}: CrewPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (memberId: string) => {
    setSelected((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : current.length < capacity
          ? [...current, memberId]
          : current,
    );
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6"
      role="dialog"
    >
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-line bg-surface p-6 shadow-panel">
        <h2 className={`m-0 ${typography.panelHeading}`}>{title}</h2>
        <p className={`mt-2 mb-4 ${typography.narrativeCaption}`}>{intro}</p>
        <p className={`m-0 mb-3 ${typography.metadata}`}>
          Bring up to {capacity} — leadership runs the room. ({selected.length}/
          {capacity} picked)
        </p>

        {crew.length === 0 ? (
          <p className={typography.metadata}>
            Nobody is free right now. You go alone.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {crew.map((member) => {
              const isSelected = selected.includes(member.id);
              const archetype = CREW_ARCHETYPES[member.archetype];
              return (
                <li key={member.id}>
                  <button
                    aria-pressed={isSelected}
                    className={cx(
                      "flex w-full cursor-pointer items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition-colors duration-150",
                      isSelected
                        ? "border-brass bg-brass/15"
                        : "border-line bg-black/20 hover:border-brass/60",
                    )}
                    onClick={() => toggle(member.id)}
                    type="button"
                  >
                    <span>
                      <span className={`${displayText} text-lg text-title`}>
                        {member.name}
                      </span>
                      <span className={`ml-2 ${typography.metadata}`}>
                        {CREW_TIER_LABELS[member.tier]} · {archetype.label}
                      </span>
                    </span>
                    <span className={typography.metadata}>
                      +{crewCheckBonus(member)}% {archetype.skill} · power{" "}
                      {crewMemberPower(member)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button disabled={isBusy} onClick={onCancel} variant="quiet">
            Never mind
          </Button>
          <Button
            disabled={isBusy}
            onClick={() => onConfirm(selected)}
            variant="primary"
          >
            {confirmLabel}
            {selected.length > 0 ? ` with ${selected.length}` : " alone"}
          </Button>
        </div>
      </div>
    </div>
  );
}
