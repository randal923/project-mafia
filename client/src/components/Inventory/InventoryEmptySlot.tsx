import type { ReactNode } from "react";

type InventoryEmptySlotProps = {
  children: ReactNode;
};

export function InventoryEmptySlot({ children }: InventoryEmptySlotProps) {
  return (
    <div className="flex aspect-square w-full items-center justify-center border border-dashed border-line bg-black/20 p-3">
      {children}
    </div>
  );
}
