import type { MissionAcceptedState } from "@shared/job";
import type { EquipmentSlotId } from "@shared/player";
import { SKILLS } from "@shared/skills";
import { useTranslations } from "next-intl";
import { displayText, typography } from "../../design-system/typography";
import { useCatalogText } from "../../lib/useCatalogText";

type MissionAcceptedEquipmentProps = {
  acceptedState?: MissionAcceptedState;
};

const slotIds: readonly EquipmentSlotId[] = [
  "head",
  "torso",
  "hand",
  "waist",
  "feet",
];

export function MissionAcceptedEquipment({
  acceptedState,
}: MissionAcceptedEquipmentProps) {
  const t = useTranslations("mission.acceptedEquipment");
  const { itemName, skillName } = useCatalogText();

  if (!acceptedState) {
    return <p className={`m-0 ${typography.metadata}`}>{t("unavailable")}</p>;
  }

  const effects = Object.values(acceptedState.loadout).flatMap(
    (item) => item?.effects ?? [],
  );

  return (
    <section
      aria-label={t("ariaLabel")}
      className="rounded-panel border border-line bg-black/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={`m-0 ${displayText} text-xl text-title`}>
          {t("title")}
        </h3>
        <p className={`m-0 ${typography.metadata}`}>
          {t("powerArmor", {
            armor: acceptedState.armor,
            power: acceptedState.totalPower,
          })}
        </p>
      </div>
      <p className={`m-0 mt-1 ${typography.metadata}`}>
        {t("lockedPower", {
          character: acceptedState.characterPower,
          equipment: acceptedState.equipmentPower,
        })}
      </p>
      <dl className="m-0 mt-3 grid gap-2 sm:grid-cols-5">
        {slotIds.map((id) => {
          const item = acceptedState.loadout[id];
          return (
            <div className="rounded-control border border-line p-2" key={id}>
              <dt className={typography.metadata}>{t(`slots.${id}`)}</dt>
              <dd className="m-0 text-sm font-medium text-ink">
                {item ? itemName(item) : t("empty")}
              </dd>
              {item ? (
                <dd className={`m-0 mt-1 ${typography.metadata}`}>
                  {id === "hand"
                    ? t("itemPower", { power: item.power ?? 0 })
                    : t("itemPowerArmor", {
                        armor: item.armor ?? 0,
                        power: item.power ?? 0,
                      })}
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>
      {effects.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
          {effects.map((effect, index) => (
            <li
              className="rounded-control border border-brass/60 px-2 py-1 text-sm font-medium text-brass-bright"
              key={`${effect.type}-${index}`}
            >
              {effect.type === "skillBonus"
                ? t("effects.skillBonus", {
                    skill: skillName(effect.skill),
                    value: effect.value,
                  })
                : effect.type === "approachBonus"
                  ? t("effects.approachBonus", {
                      approach: effect.approach,
                      value: effect.value,
                    })
                  : t("effects.heatReduction", { value: effect.value })}
            </li>
          ))}
        </ul>
      ) : null}
      {acceptedState.gear.length > 0 ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className={`m-0 ${typography.metadata}`}>{t("stashGear")}</p>
          <ul className="m-0 mt-2 grid list-none gap-2 p-0 sm:grid-cols-2">
            {acceptedState.gear.map((item) => (
              <li
                className="rounded-control border border-line p-2 text-sm font-medium text-ink"
                key={item.id}
              >
                {itemName(item)} ×{item.quantity ?? 1}
                <span className={`block ${typography.metadata}`}>
                  {item.consumable
                    ? item.power
                      ? t("gearSingleUsePower", { power: item.power })
                      : t("gearSingleUse")
                    : t("gearReusable")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
