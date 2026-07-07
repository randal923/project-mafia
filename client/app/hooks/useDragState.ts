"use client";

import { useState } from "react";
import type { DragEvent } from "react";

type DragPosition = {
  x: number;
  y: number;
};

type StartDragOptions<DraggedId extends string> = {
  data: string;
  draggedId: DraggedId;
  mimeType: string;
};

const transparentDragImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export function useDragState<
  DraggedId extends string,
  ActiveTargetId extends string,
>() {
  const [draggedId, setDraggedId] = useState<DraggedId | null>(null);
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [activeTargetId, setActiveTargetId] =
    useState<ActiveTargetId | null>(null);

  const clearDragState = () => {
    setDraggedId(null);
    setDragPosition(null);
    setActiveTargetId(null);
  };

  const updateDragPosition = (event: DragEvent<HTMLElement>) => {
    if (event.clientX === 0 && event.clientY === 0) {
      return;
    }

    setDragPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const startDrag = (
    event: DragEvent<HTMLElement>,
    { data, draggedId: nextDraggedId, mimeType }: StartDragOptions<DraggedId>,
  ) => {
    setDraggedId(nextDraggedId);
    updateDragPosition(event);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(mimeType, data);

    const dragImage = new window.Image();
    dragImage.src = transparentDragImageSrc;
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  return {
    activeTargetId,
    clearDragState,
    dragPosition,
    draggedId,
    setActiveTargetId,
    startDrag,
    updateDragPosition,
  };
}
