import Image from "next/image";
import type { Equipment, EquipmentEffect } from "@shared/equipment";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";

type StoreItemCardProps = {
  isBusy: boolean;
  isLocked: boolean;
  item: Equipment;
  onBuy: (equipmentId: string, quantity: number) => void;
  ownedQuantity: number;
  playerCash: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

const slotLabels: Record<string, string> = {
  feet: "Feet",
  hand: "Hand",
  head: "Head",
  torso: "Torso",
  waist: "Waist"
};

const approachLabels: Record<string, string> = {
  deception: "deception",
  force: "force",
  opportunistic: "opportunistic",
  quiet: "quiet",
  social: "social",
  technical: "technical"
};

function effectLabel(effect: EquipmentEffect): string {
  if (effect.type === "skillBonus") {
    const skill = effect.skill.charAt(0).toUpperCase() + effect.skill.slice(1);
    return `+${effect.value} ${skill} on checks`;
  }
  if (effect.type === "approachBonus") {
    return `+${effect.value}% on ${approachLabels[effect.approach] ?? effect.approach} moves`;
  }
  return `−${effect.value} heat per job`;
}

export function StoreItemCard({
  isBusy,
  isLocked,
  item,
  onBuy,
  ownedQuantity,
  playerCash
}: StoreItemCardProps) {
  const canAfford = playerCash >= item.price;
  const purchasable = !isLocked && canAfford && !isBusy;

  return (
    <article
      className={cx(
        "flex flex-col rounded-panel border bg-surface-raised shadow-panel transition-colors duration-150",
        isLocked ? "border-line" : "border-line hover:border-brass"
      )}
    >
      <div className="relative flex h-32 items-center justify-center border-b border-line bg-black/40 p-3">
        <Image
          alt={item.image.alt}
          className={cx(
            "h-full w-full object-contain drop-shadow",
            isLocked && "opacity-30 grayscale"
          )}
          height={200}
          src={item.image.src}
          width={200}
        />
        {ownedQuantity > 0 ? (
          <span className="absolute top-2 right-2 rounded-control border border-brass bg-page/90 px-2 py-1 text-sm font-medium leading-none text-brass-bright">
            Owned ×{ownedQuantity}
          </span>
        ) : null}
        {isLocked ? (
          <span
            className={`absolute bottom-2 left-2 rounded-control border border-danger bg-page/90 px-2 py-1 ${displayText} text-base text-danger-strong`}
          >
            Level {item.levelRequirement}
          </span>
        ) : (
          <span className="absolute bottom-2 left-2 rounded-control border border-line bg-page/90 px-2 py-1 text-sm font-medium leading-none text-faint">
            Lv {item.levelRequirement}
            {item.slot ? ` · ${slotLabels[item.slot]}` : " · Stash"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={`m-0 ${displayText} text-2xl leading-none text-title`}>
          {item.name}
        </h3>
        <p className={`m-0 flex-1 ${typography.narrativeCaption}`}>
          {item.description}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {item.power > 0 ? (
            <span className={`${displayText} text-lg text-brass`}>
              Power {item.power}
            </span>
          ) : null}
          {item.armor ? (
            <span className={`${displayText} text-lg text-teal`}>
              Armor {item.armor}
            </span>
          ) : null}
          {item.use?.stamina ? (
            <span className={`${displayText} text-lg text-profit`}>
              +{item.use.stamina} Stamina
            </span>
          ) : null}
          {item.use?.health ? (
            <span className={`${displayText} text-lg text-teal`}>
              +{item.use.health} Health
            </span>
          ) : null}
          {item.use?.heat ? (
            <span
              className={`${displayText} text-lg ${item.use.heat > 0 ? "text-danger-strong" : "text-teal"}`}
            >
              {item.use.heat > 0 ? `+${item.use.heat}` : item.use.heat} Heat
            </span>
          ) : null}
          {item.use?.high ? (
            <span className={`${displayText} text-lg text-teal`}>
              +{item.use.high} High
            </span>
          ) : null}
          {item.use?.drunk ? (
            <span className={`${displayText} text-lg text-teal`}>
              +{item.use.drunk} Drunk
            </span>
          ) : null}
          {item.consumable ? (
            <span className={`${displayText} text-lg text-faint`}>
              Single use
            </span>
          ) : null}
        </div>

        {item.effects?.length ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {item.effects.map((effect, index) => (
              <li
                className="text-sm font-medium leading-normal text-brass-bright"
                key={index}
              >
                {effectLabel(effect)}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-3">
          <p
            className={cx(
              `m-0 ${displayText} text-xl`,
              isLocked ? "text-faint" : canAfford ? "text-profit" : "text-danger-strong"
            )}
          >
            {moneyFormatter.format(item.price)}
          </p>
          <div className="flex gap-2">
            {item.consumable ? (
              <Button
                aria-label={`Buy five ${item.name}`}
                disabled={!purchasable || playerCash < item.price * 5}
                onClick={() => onBuy(item.id, 5)}
                size="small"
                variant="secondary"
              >
                ×5
              </Button>
            ) : null}
            <Button
              disabled={!purchasable}
              onClick={() => onBuy(item.id, 1)}
              size="small"
              variant={isLocked ? "quiet" : "primary"}
            >
              {isLocked ? "Locked" : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
