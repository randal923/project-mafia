import type { MissionAcceptedState } from "@shared/job";
import type { EquipmentSlotId } from "@shared/player";
import { SKILLS } from "@shared/skills";
import { displayText, typography } from "../../design-system/typography";

type MissionAcceptedEquipmentProps = {
  acceptedState?: MissionAcceptedState;
};

const slots: readonly { id: EquipmentSlotId; label: string }[] = [
  { id: "head", label: "Head" },
  { id: "torso", label: "Torso" },
  { id: "hand", label: "Hand" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Feet" },
];

export function MissionAcceptedEquipment({
  acceptedState,
}: MissionAcceptedEquipmentProps) {
  if (!acceptedState) {
    return (
      <p className={`m-0 ${typography.metadata}`}>
        Accepted equipment details are unavailable for this older job.
      </p>
    );
  }

  const effects = Object.values(acceptedState.loadout).flatMap(
    (item) => item?.effects ?? [],
  );

  return (
    <section
      aria-label="Accepted mission equipment"
      className="rounded-panel border border-line bg-black/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={`m-0 ${displayText} text-xl text-title`}>
          Accepted equipment
        </h3>
        <p className={`m-0 ${typography.metadata}`}>
          Power {acceptedState.totalPower} · Armor {acceptedState.armor}
        </p>
      </div>
      <p className={`m-0 mt-1 ${typography.metadata}`}>
        Locked for this job: {acceptedState.characterPower} character +{" "}
        {acceptedState.equipmentPower} equipment power.
      </p>
      <dl className="m-0 mt-3 grid gap-2 sm:grid-cols-5">
        {slots.map(({ id, label }) => {
          const item = acceptedState.loadout[id];
          return (
            <div className="rounded-control border border-line p-2" key={id}>
              <dt className={typography.metadata}>{label}</dt>
              <dd className="m-0 text-sm font-medium text-ink">
                {item?.name ?? "Empty"}
              </dd>
              {item ? (
                <dd className={`m-0 mt-1 ${typography.metadata}`}>
                  P {item.power ?? 0}
                  {id === "hand" ? "" : ` · A ${item.armor ?? 0}`}
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
                ? `+${effect.value} ${SKILLS[effect.skill].label} checks`
                : effect.type === "approachBonus"
                  ? `+${effect.value}% ${effect.approach}`
                  : `−${effect.value} heat`}
            </li>
          ))}
        </ul>
      ) : null}
      {acceptedState.gear.length > 0 ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className={`m-0 ${typography.metadata}`}>
            Relevant stash gear at acceptance
          </p>
          <ul className="m-0 mt-2 grid list-none gap-2 p-0 sm:grid-cols-2">
            {acceptedState.gear.map((item) => (
              <li
                className="rounded-control border border-line p-2 text-sm font-medium text-ink"
                key={item.id}
              >
                {item.name} ×{item.quantity ?? 1}
                <span className={`block ${typography.metadata}`}>
                  {item.consumable
                    ? `Power ${item.power ?? 0} only when a choice consumes it`
                    : "Reusable mission tool · no check-power bonus"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
