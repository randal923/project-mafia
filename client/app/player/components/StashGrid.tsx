import type {
  DragPayload,
  LoadoutState,
  PlayerItemsById,
} from "../lib/playerTypes";
import { Card } from "./Card";
import { ItemTile } from "./ItemTile";

type StashGridProps = {
  itemsById: PlayerItemsById;
  loadoutState: LoadoutState;
  onDragEnd: () => void;
  onDragMove: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (
    event: React.DragEvent<HTMLElement>,
    payload: DragPayload,
  ) => void;
  onDropOnInventory: (event: React.DragEvent<HTMLElement>) => void;
};

const minimumStashCellCount = 12;
const stashColumnCount = 4;

export function StashGrid({
  itemsById,
  loadoutState,
  onDragEnd,
  onDragMove,
  onDragStart,
  onDropOnInventory,
}: StashGridProps) {
  const stashCellCount = Math.max(
    minimumStashCellCount,
    Math.ceil(loadoutState.inventory.length / stashColumnCount) *
      stashColumnCount,
  );
  const cells = Array.from({ length: stashCellCount }, (_, index) => {
    const itemId = loadoutState.inventory[index];

    return itemId ? itemsById[itemId] : null;
  });

  return (
    <Card
      className="flex min-h-0 flex-1 flex-col"
      eyebrow="Inventory"
      headerDetail="Drop to unequip"
      onDragOver={(event) => {
        onDragMove(event);
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDropOnInventory}
      title="Stash"
      titleSize="medium"
    >
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-4">
        {cells.map((item, index) => (
          <div
            key={item?.id ?? `empty-${index}`}
            className="min-h-0 border-b border-r border-line bg-stash-grid p-1.5"
          >
            {item ? (
              <div
                draggable
                className="h-full cursor-grab active:cursor-grabbing"
                onDrag={onDragMove}
                onDragEnd={onDragEnd}
                onDragStart={(event) =>
                  onDragStart(event, {
                    source: "inventory",
                    itemId: item.id,
                  })
                }
              >
                <ItemTile item={item} isCompact />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
