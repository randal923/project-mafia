import type { EquipmentSlotId, Player, PlayerItem } from "@shared/player";

export type LoadoutUpdate =
  | { item: PlayerItem; type: "equip" }
  | { slotId: EquipmentSlotId; type: "unequip" };

type RunOptimisticLoadoutMutationOptions = {
  mutate: () => Promise<Player>;
  player: Player;
  setPlayer: (player: Player) => void;
  update: LoadoutUpdate;
};

function removeOne(stash: readonly PlayerItem[], itemIndex: number) {
  const item = stash[itemIndex];
  if (!item) {
    return [...stash];
  }

  const quantity = item.quantity ?? 1;
  return quantity > 1
    ? stash.map((entry, index) =>
        index === itemIndex ? { ...entry, quantity: quantity - 1 } : entry
      )
    : stash.filter((_, index) => index !== itemIndex);
}

function createOptimisticPlayer(player: Player, update: LoadoutUpdate) {
  if (update.type === "unequip") {
    const item = player.loadout[update.slotId];
    if (!item) {
      return player;
    }

    const loadout = { ...player.loadout };
    delete loadout[update.slotId];

    return {
      ...player,
      loadout,
      stash: [...player.stash, item]
    };
  }

  const itemIndex = player.stash.indexOf(update.item);
  const item = player.stash[itemIndex];
  if (
    !item?.slot ||
    (item.levelRequirement !== undefined &&
      player.progression.level < item.levelRequirement)
  ) {
    return player;
  }

  const stash = removeOne(player.stash, itemIndex);
  const replacedItem = player.loadout[item.slot];
  if (replacedItem) {
    stash.push(replacedItem);
  }

  return {
    ...player,
    loadout: {
      ...player.loadout,
      [item.slot]: { ...item, quantity: 1 }
    },
    stash
  };
}

export async function runOptimisticLoadoutMutation({
  mutate,
  player,
  setPlayer,
  update
}: RunOptimisticLoadoutMutationOptions) {
  setPlayer(createOptimisticPlayer(player, update));

  try {
    setPlayer(await mutate());
    return { error: null, failed: false } as const;
  } catch (error) {
    setPlayer(player);
    return { error, failed: true } as const;
  }
}
