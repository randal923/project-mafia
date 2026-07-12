"use client";

import {
  CREW_ARCHETYPES,
  CREW_SLOT_IDS,
  crewBribeCost,
  crewCheckBonus,
  crewMemberPower,
  crewTrainingCost,
  crewWage,
  type CrewMember,
  type CrewSlotId,
} from "@shared/crew";
import type { PlayerItem } from "@shared/player";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { useCatalogText } from "../../lib/useCatalogText";
import { useCrewText } from "../../lib/useCrewText";
import { useFormatters } from "../../lib/useFormatters";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

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
  const t = useTranslations("crew");
  const locale = useLocale();
  const { moneyFormatter } = useFormatters();
  const { crewBio, crewName } = useCrewText();
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );
  const { archetypeName, itemName, skillName, tierName, traitName } =
    useCatalogText();
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
            {crewName(member.name)}
          </p>
          <p className={`m-0 ${typography.metadata}`}>
            {tierName(member.tier)} · {archetypeName(member.archetype)}
          </p>
        </div>
        <Tag
          className={cx(
            member.status === "idle" && "border-brass text-brass",
            (member.status === "imprisoned" || member.status === "injured") &&
              "border-danger text-danger-strong",
          )}
          label={t(`status.${member.status}`)}
        />
      </header>

      <p className={`m-0 ${typography.narrativeCaption}`}>
        {crewBio(member)}
      </p>

      <dl className="m-0 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-control border border-brass/50 bg-brass/10 px-2 py-2">
          <dt className={typography.metadata}>
            {skillName(archetype.skill)}
          </dt>
          <dd className={`m-0 ${displayText} text-lg text-brass-bright`}>
            {member.skillLevel}
          </dd>
        </div>
        {[
          [t("stats.power"), String(power)],
          [t("stats.jobBonus"), `+${bonus}%`],
          [t("stats.wagePerDay"), moneyFormatter.format(wage)],
          [t("stats.loyalty"), `${member.loyalty}`],
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
              label={traitName(trait)}
            />
          ))}
        </div>
      ) : null}

      {busyUntilMs && busyUntilMs > now ? (
        <p className={`m-0 ${typography.metadata}`}>
          {t("backAround", {
            time: timeFormatter.format(busyUntilMs),
          })}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {CREW_SLOT_IDS.map((slot) => {
          const equipped = member.loadout[slot];
          const options = eligibleItems.filter((item) => item.slot === slot);
          return (
            <div className="flex items-center gap-2" key={slot}>
              <span className={`w-16 shrink-0 ${typography.metadata}`}>
                {t(`slots.${slot}`)}
              </span>
              {equipped ? (
                <>
                  <span className={`flex-1 truncate ${typography.paragraph}`}>
                    {itemName(equipped)}
                  </span>
                  <Button
                    disabled={isBusy || member.status === "imprisoned"}
                    onClick={() => onUnequip(member.id, slot)}
                    size="small"
                    variant="quiet"
                  >
                    {t("removeGear")}
                  </Button>
                </>
              ) : equippingSlot === slot ? (
                <select
                  aria-label={t("equipSlotAria", { slot: t(`slots.${slot}`) })}
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
                  <option value="">{t("pickFromStash")}</option>
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {itemName(item)}
                      {item.levelRequirement
                        ? ` ${t("skillRequirement", { level: item.levelRequirement })}`
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
                  {options.length === 0 ? t("nothingFits") : t("equip")}
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
          {t("train", {
            cost: moneyFormatter.format(crewTrainingCost(member.skillLevel)),
          })}
        </Button>
        {member.status === "imprisoned" ? (
          <Button
            disabled={isBusy}
            onClick={() => onBribe(member.id)}
            size="small"
            variant="primary"
          >
            {t("bribeOut", {
              cost: moneyFormatter.format(crewBribeCost(member)),
            })}
          </Button>
        ) : null}
        <Button
          disabled={isBusy || member.status === "on_job"}
          onClick={() => onFire(member.id)}
          size="small"
          variant="danger"
        >
          {t("cutLoose")}
        </Button>
      </footer>
    </article>
  );
}
