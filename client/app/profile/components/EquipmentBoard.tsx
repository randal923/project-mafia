import Image from "next/image";
import { equipmentSlots, profileItemsById } from "../lib/profileData";
import type {
  DragPayload,
  EquipmentSlotId,
  LoadoutState,
} from "../lib/profileTypes";
import { Card } from "./Card";
import { ItemTile } from "./ItemTile";

type EquipmentBoardProps = {
  activeSlotId: EquipmentSlotId | null;
  canDropOnSlot: (slotId: EquipmentSlotId) => boolean;
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
  state: LoadoutState;
};

const slotPositions: Record<EquipmentSlotId, string> = {
  head: "left-[38%] top-2",
  torso: "left-[38%] top-[32%]",
  hand: "left-3 top-[46%]",
  waist: "right-3 top-[46%]",
  feet: "left-[38%] bottom-2",
};

export function EquipmentBoard({
  activeSlotId,
  canDropOnSlot,
  onDragEnd,
  onDragLeave,
  onDragMove,
  onDragStart,
  onDropOnSlot,
  onSetActiveSlot,
  state,
}: EquipmentBoardProps) {
  return (
    <Card
      className="flex min-h-0 flex-[0_0_52%] flex-col"
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
          className="object-contain opacity-[0.12] grayscale"
        />
        <div className="absolute inset-7 border border-line/60" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(240_234_219_/_0.04)_25%,transparent_25%,transparent_50%,rgb(240_234_219_/_0.04)_50%,rgb(240_234_219_/_0.04)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-25" />

        {equipmentSlots.map((slot) => {
          const itemId = state.equipment[slot.id];
          const item = itemId ? profileItemsById[itemId] : null;
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
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ash">
                  {slot.label}
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.16em] text-sulfur">
                  Slot
                </p>
              </div>

              {item ? (
                <div
                  draggable
                  className="h-[4.8rem] cursor-grab active:cursor-grabbing"
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
                <div className="flex h-[4.8rem] items-center justify-center border border-dashed border-line text-xs uppercase tracking-[0.16em] text-iron">
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
