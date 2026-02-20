"use client";

import React from "react";
import { useDrop } from "react-dnd";

const LINK_TYPE = "link";

type Props = {
  insertIndex: number;
  onReorder: (draggedLinkId: string, insertIndex: number) => void;
};

export function ReorderDropSlot({ insertIndex, onReorder }: Props) {
  const [{ isOver }, drop] = useDrop({
    accept: LINK_TYPE,
    drop: (item: { linkId: string }) => onReorder(item.linkId, insertIndex),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`w-full min-h-[60px] rounded-lg transition-colors flex items-center justify-center
        ${isOver ? "bg-moo-accent/15 ring-2 ring-moo-accent/40 ring-inset" : "bg-transparent"}
      `}
    >
      {isOver && <div className="w-full h-0.5 bg-moo-accent/60 rounded-full max-w-[60%]" aria-hidden />}
    </div>
  );
}
