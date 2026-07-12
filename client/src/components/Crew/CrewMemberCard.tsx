"use client";

import {
  CREW_ARCHETYPES,
  CREW_SLOT_IDS,
  CREW_TIER_LABELS,
  CREW_TRAITS,
  crewBribeCost,
  crewCheckBonus,
  crewMemberPower,
  crewTrainingCost,
  crewWage,
  type CrewMember,
  type CrewSlotId,
} from "@shared/crew";
import type { PlayerItem } from "@shared/player";
import { SKILLS } from "@shared/skills";
import { useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const SLOT_LABELS: Record<CrewSlotId, string> = {
  hand: "Weapon",
  torso: "Vest",
  waist: "Belt",
};

const STATUS_LABELS: Record<CrewMember["status"], string> = {
  assigned_building: "Working a floor",
  assigned_turf: "Standing guard",
  dead: "Gone",
  idle: "Ready",
  imprisoned: "In a cell",
  injured: "Recovering",
  on_job: "Out on a job",
  training: "Training",
};

type CrewMemberCardProps = {
  isBusy: boolean;
  member: CrewMember;
  /** Player stash items equippable on crew (hand/torso/waist, non-consumable). */
  eligibleItems: PlayerItem[];
  onBribe: (memberId: string) => void;
  onEquip: (memberId: string, itemId: string) => void;
  onFire: (memberId: string) => void;
  onTrain: (memberId: string) => void;
  onUnequip: (memberId: string, slot: CrewSlotId) => void;
};

export function CrewMemberCard({
  eligibleItems,
  isBusy,
  member,
  onBribe,
  onEquip,
  onFire,
  onTrain,
  onUnequip,
}: CrewMemberCardProps) {
  const [equippingSlot, setEquippingSlot] = useState<CrewSlotId | null>(null);
  const [now] = useState(() => Date.now());
  const archetype = CREW_ARCHETYPES[member.archetype];
  const wage = crewWage(member.tier, member.skillLevel, member.traits);
  const power = crewMemberPower(member);
  const bonus = crewCheckBonus(member);
  const busyUntilMs = member.busyUntil ? Date.parse(member.busyUntil) : null;
  const isAvailable = member.status === "idle";

  return (
    <article className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className={`m-0 ${displayText} text-2xl text-title`}>
            {member.name}
          </p>
          <p className={`m-0 ${typography.metadata}`}>
            {CREW_TIER_LABELS[member.tier]} · {archetype.label}
          </p>
        </div>
        <Tag
          className={cx(
            member.status === "idle" && "border-brass text-brass",
            (member.status === "imprisoned" || member.status === "injured") &&
              "border-danger text-danger-strong",
          )}
          label={STATUS_LABELS[member.status]}
        />
      </header>

      <p className={`m-0 ${typography.narrativeCaption}`}>{member.bio}</p>

      <dl className="m-0 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-control border border-brass/50 bg-brass/10 px-2 py-2">
          <dt className={typography.metadata}>
            {SKILLS[archetype.skill].label}
          </dt>
          <dd className={`m-0 ${displayText} text-lg text-brass-bright`}>
            {member.skillLevel}
          </dd>
        </div>
        {[
          ["Power", String(power)],
          ["Job bonus", `+${bonus}%`],
          ["Wage/day", moneyFormatter.format(wage)],
          ["Loyalty", `${member.loyalty}`],
        ].map(([label, value]) => (
          <div
            className="rounded-control border border-line bg-black/20 px-2 py-2"
            key={label}
          >
            <dt className={typography.metadata}>{label}</dt>
            <dd className={`m-0 ${displayText} text-lg text-brass-bright`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {member.traits.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {member.traits.map((trait) => (
            <Tag
              className="border-brass/60 text-brass"
              key={trait}
              label={CREW_TRAITS[trait].label}
            />
          ))}
        </div>
      ) : null}

      {busyUntilMs && busyUntilMs > now ? (
        <p className={`m-0 ${typography.metadata}`}>
          Back around{" "}
          {new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(busyUntilMs)}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {CREW_SLOT_IDS.map((slot) => {
          const equipped = member.loadout[slot];
          const options = eligibleItems.filter((item) => item.slot === slot);
          return (
            <div className="flex items-center gap-2" key={slot}>
              <span className={`w-16 shrink-0 ${typography.metadata}`}>
                {SLOT_LABELS[slot]}
              </span>
              {equipped ? (
                <>
                  <span className={`flex-1 truncate ${typography.paragraph}`}>
                    {equipped.name}
                  </span>
                  <Button
                    disabled={isBusy || member.status === "imprisoned"}
                    onClick={() => onUnequip(member.id, slot)}
                    size="small"
                    variant="quiet"
                  >
                    Remove
                  </Button>
                </>
              ) : equippingSlot === slot ? (
                <select
                  aria-label={`Equip ${SLOT_LABELS[slot]}`}
                  className="flex-1 rounded-control border border-line bg-black/30 px-2 py-1 text-ink"
                  disabled={isBusy}
                  onChange={(event) => {
                    if (event.target.value) {
                      onEquip(member.id, event.target.value);
                    }
                    setEquippingSlot(null);
                  }}
                  value=""
                >
                  <option value="">Pick from your stash…</option>
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.levelRequirement
                        ? ` (skill ${item.levelRequirement})`
                        : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Button
                  disabled={
                    isBusy ||
                    options.length === 0 ||
                    member.status === "imprisoned"
                  }
                  onClick={() => setEquippingSlot(slot)}
                  size="small"
                  variant="secondary"
                >
                  {options.length === 0 ? "Nothing fits" : "Equip"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <footer className="mt-1 flex flex-wrap gap-2">
        <Button
          disabled={isBusy || !isAvailable}
          onClick={() => onTrain(member.id)}
          size="small"
          variant="secondary"
        >
          Train ({moneyFormatter.format(crewTrainingCost(member.skillLevel))})
        </Button>
        {member.status === "imprisoned" ? (
          <Button
            disabled={isBusy}
            onClick={() => onBribe(member.id)}
            size="small"
            variant="primary"
          >
            Bribe out ({moneyFormatter.format(crewBribeCost(member))})
          </Button>
        ) : null}
        <Button
          disabled={isBusy || member.status === "on_job"}
          onClick={() => onFire(member.id)}
          size="small"
          variant="danger"
        >
          Cut loose
        </Button>
      </footer>
    </article>
  );
}
