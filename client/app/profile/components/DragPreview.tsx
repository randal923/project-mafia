import type { ProfileItem } from "../lib/profileTypes";
import { ItemTile } from "./ItemTile";

type DragPreviewProps = {
  item: ProfileItem | null;
  position: {
    x: number;
    y: number;
  } | null;
};

export function DragPreview({ item, position }: DragPreviewProps) {
  if (!item || !position) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-100 h-32 w-44 border border-sulfur bg-obsidian/95 p-2 shadow-menu"
      style={{
        left: position.x + 18,
        top: position.y + 18,
      }}
    >
      <ItemTile item={item} isCompact />
    </div>
  );
}
