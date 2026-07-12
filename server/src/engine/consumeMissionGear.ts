import { ChoiceEdge } from "../../../shared/job";
import { Player } from "../../../shared/player";

export function consumeMissionGear(
  player: Player,
  edge: ChoiceEdge,
  nowIso: string,
): { consumed: boolean; player: Player } {
  const gear = edge.gear;
  if (!gear || !gear.satisfied || !gear.consumes) {
    return { consumed: false, player };
  }

  const index = player.stash.findIndex((item) =>
    gear.item?.id
      ? item.id === gear.item.id && item.consumable
      : item.consumable &&
        item.tags?.some((tag) => gear.tags.includes(tag)),
  );
  if (index === -1) {
    return { consumed: false, player };
  }

  const item = player.stash[index]!;
  const remaining = (item.quantity ?? 1) - 1;
  const stash =
    remaining > 0
      ? player.stash.map((entry, itemIndex) =>
          itemIndex === index ? { ...entry, quantity: remaining } : entry,
        )
      : player.stash.filter((_, itemIndex) => itemIndex !== index);

  return {
    consumed: true,
    player: { ...player, stash, updatedAt: nowIso },
  };
}
