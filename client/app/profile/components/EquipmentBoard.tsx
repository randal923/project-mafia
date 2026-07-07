import Image from "next/image";
import type {
  DragPayload,
  EquipmentSlot,
  EquipmentSlotId,
  LoadoutState,
  ProfileItemsById,
} from "../lib/profileTypes";
import { Card } from "./Card";
import { ItemTile } from "./ItemTile";

type EquipmentBoardProps = {
  activeSlotId: EquipmentSlotId | null;
  canDropOnSlot: (slotId: EquipmentSlotId) => boolean;
  equipmentSlots: EquipmentSlot[];
  itemsById: ProfileItemsById;
  loadoutState: LoadoutState;
  onDragEnd: () => void;
  onDragLeave: () => void;
  onDragMove: (event: React.DragEvent<HTMLElement>) => void;
  onDragStart: (
    event: React.DragEvent<HTMLElement>,
    payload: DragPayload,
  ) => void;
  onDropOnSlot: (
    event: React.DragEvent<HTMLElement>,
    slotId: EquipmentSlotId,
  ) => void;
  onSetActiveSlot: (slotId: EquipmentSlotId) => void;
};

const slotPositions: Record<EquipmentSlotId, string> = {
  head: "left-2/5 top-2",
  torso: "left-2/5 top-1/3",
  hand: "left-3 top-1/2",
  waist: "right-3 top-1/2",
  feet: "left-2/5 bottom-2",
};

export function EquipmentBoard({
  activeSlotId,
  canDropOnSlot,
  equipmentSlots,
  itemsById,
  loadoutState,
  onDragEnd,
  onDragLeave,
  onDragMove,
  onDragStart,
  onDropOnSlot,
  onSetActiveSlot,
}: EquipmentBoardProps) {
  return (
    <Card
      className="flex min-h-0 flex-none basis-1/2 flex-col"
      eyebrow="Profile"
      headerDetail="Gear slots"
      title="Loadout"
      titleLevel={1}
      titleTracking="wide"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Image
          src="/assets/profile/character.png"
          alt=""
          fill
          sizes="520px"
          className="object-contain opacity-10 grayscale"
        />
        <div className="absolute inset-7 border border-line/60" />
        <div className="absolute inset-0 bg-loadout-grid opacity-25" />

        {equipmentSlots.map((slot) => {
          const itemId = loadoutState.equipment[slot.id];
          const item = itemId ? itemsById[itemId] : null;
          const canDrop = canDropOnSlot(slot.id);
          const isActive = activeSlotId === slot.id && canDrop;

          return (
            <div
              key={slot.id}
              className={`absolute z-10 h-28 w-36 border bg-obsidian/80 p-1.5 shadow-menu transition ${
                isActive ? "border-sulfur" : "border-line"
              } ${slotPositions[slot.id]}`}
              onDragLeave={onDragLeave}
              onDragOver={(event) => {
                onDragMove(event);

                if (!canDrop) {
                  return;
                }

                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                onSetActiveSlot(slot.id);
              }}
              onDrop={(event) => onDropOnSlot(event, slot.id)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-widest text-ash">
                  {slot.label}
                </p>
                <p className="text-xs uppercase tracking-widest text-sulfur">
                  Slot
                </p>
              </div>

              {item ? (
                <div
                  draggable
                  className="h-20 cursor-grab active:cursor-grabbing"
                  onDrag={onDragMove}
                  onDragEnd={onDragEnd}
                  onDragStart={(event) =>
                    onDragStart(event, {
                      source: "equipment",
                      itemId: item.id,
                      slotId: slot.id,
                    })
                  }
                >
                  <ItemTile item={item} isCompact />
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center border border-dashed border-line text-xs uppercase tracking-widest text-iron">
                  Empty
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
