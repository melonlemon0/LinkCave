"use client";

import type { ShelfTab } from "@/types/linkfridge";
import NextLink from "next/link";
import type { DragEvent } from "react";
import { IconFridge, IconFruitLocker, IconMeatLocker, IconSettings, IconSnowflake } from "./icons";

type Props = {
  tab: ShelfTab;
  onTab: (t: ShelfTab) => void;
  fridgeCount: number;
  /** Main freezer column */
  frozenCount: number;
  meatCount: number;
  fruitCount: number;
  dragOver: ShelfTab | null;
  onDragOverShelf: (shelf: ShelfTab, e: DragEvent<Element>) => void;
  onDropShelf: (shelf: ShelfTab, e: DragEvent<Element>) => void;
};

function shelfCardClass(shelf: ShelfTab, tab: ShelfTab, isDragOver: boolean): string {
  const selected = tab === shelf;
  /** Keep layout/weight stable while dragging — only the active tab sets muted look; drag target uses a ring. */
  const dimInactive = selected ? "" : " opacity-[0.82] saturate-[0.92]";
  const dragRing = isDragOver ? " z-[1] ring-2 ring-moo-accent/55 ring-offset-2 ring-offset-white" : "";

  const baseCore =
    `flex h-full w-full max-w-full flex-col items-center justify-center gap-1 rounded-2xl border-0 px-0.5 py-[clamp(0.5rem,2.2dvh,1.2rem)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:gap-1.5 sm:px-1 sm:py-[clamp(0.6rem,2.5dvh,1.45rem)]${dimInactive}`;

  const minFridge = "min-h-[clamp(6rem,24dvh,11.5rem)]";
  const minCold = "min-h-[clamp(4.75rem,17dvh,8.5rem)]";

  if (shelf === "fridge") {
    const base = `${baseCore} ${minFridge}`;
    const bg = selected
      ? "bg-gradient-to-br from-sky-300/95 via-cyan-200 to-emerald-200/95 text-moo-dark shadow-md"
      : "bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 text-moo-dark shadow-sm hover:shadow-md";
    return `${base} ${bg}${dragRing}`;
  }

  const base = `${baseCore} ${minCold}`;

  if (shelf === "freezer") {
    const bg = selected
      ? "bg-sky-300/90 text-sky-950 shadow-md"
      : "bg-sky-100/95 text-sky-900 shadow-sm hover:bg-sky-200/90 hover:shadow-md";
    return `${base} ${bg}${dragRing}`;
  }

  if (shelf === "meat") {
    const bg = selected
      ? "bg-gradient-to-br from-rose-300/95 via-rose-200/90 to-amber-100/95 text-rose-950 shadow-md"
      : "bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 text-rose-950 shadow-sm hover:shadow-md";
    return `${base} ${bg}${dragRing}`;
  }

  const bg = selected
    ? "bg-gradient-to-br from-lime-300/90 via-emerald-200/90 to-yellow-100 text-lime-950 shadow-md"
    : "bg-gradient-to-br from-lime-100 via-emerald-50 to-yellow-50 text-lime-950 shadow-sm hover:shadow-md";
  return `${base} ${bg}${dragRing}`;
}

function Count({ n }: { n: number }) {
  return (
    <span className="text-xs font-bold tabular-nums tracking-tight sm:text-sm">{n}</span>
  );
}

export function FridgeShelves({
  tab,
  onTab,
  fridgeCount,
  frozenCount,
  meatCount,
  fruitCount,
  dragOver,
  onDragOverShelf,
  onDropShelf,
}: Props) {
  return (
    <aside className="sticky top-2 z-20 grid h-full min-h-0 max-h-[calc(100dvh-1.25rem)] w-14 shrink-0 select-none grid-rows-[auto_minmax(0,1.38fr)_minmax(0,0.873fr)_auto_minmax(0,0.873fr)_auto_minmax(0,0.873fr)] gap-1.5 self-start py-1 sm:w-16 sm:gap-2 sm:py-1">
      <NextLink
        href="/settings"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="flex h-[clamp(2.75rem,7.5dvh,4.5rem)] w-full shrink-0 flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-gradient-to-b from-white via-white to-moo-cream/50 shadow-sm hover:border-moo-accent/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-[clamp(3rem,8dvh,4.75rem)]"
        aria-label="Settings"
        title="Settings"
      >
        <IconSettings className="h-[clamp(1.125rem,3.2dvh,1.375rem)] w-[clamp(1.125rem,3.2dvh,1.375rem)] text-moo-dark/75 sm:h-5 sm:w-5" />
      </NextLink>

      <button
        type="button"
        draggable={false}
        onClick={() => onTab("fridge")}
        onDragOver={(e) => {
          if (tab === "fridge") return;
          onDragOverShelf("fridge", e);
        }}
        onDrop={(e) => {
          if (tab === "fridge") return;
          onDropShelf("fridge", e);
        }}
        className={shelfCardClass("fridge", tab, dragOver === "fridge")}
        aria-label={`Fridge, ${fridgeCount} links`}
      >
        <span className="flex shrink-0 opacity-90" aria-hidden>
          <IconFridge className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" />
        </span>
        <Count n={fridgeCount} />
      </button>

      <button
        type="button"
        draggable={false}
        onClick={() => onTab("freezer")}
        onDragOver={(e) => onDragOverShelf("freezer", e)}
        onDrop={(e) => onDropShelf("freezer", e)}
        className={shelfCardClass("freezer", tab, dragOver === "freezer")}
        aria-label={`Freezer, ${frozenCount} links`}
      >
        <span className="flex shrink-0 opacity-85" aria-hidden>
          <IconSnowflake className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" />
        </span>
        <Count n={frozenCount} />
      </button>

      <div className="h-2 w-full shrink-0 sm:h-2.5" aria-hidden />

      <button
        type="button"
        draggable={false}
        onClick={() => onTab("meat")}
        onDragOver={(e) => onDragOverShelf("meat", e)}
        onDrop={(e) => onDropShelf("meat", e)}
        className={shelfCardClass("meat", tab, dragOver === "meat")}
        aria-label={`Meat locker, ${meatCount} links`}
      >
        <span className="flex shrink-0 opacity-90" aria-hidden>
          <IconMeatLocker className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" />
        </span>
        <Count n={meatCount} />
      </button>

      <div className="h-2 w-full shrink-0 sm:h-2.5" aria-hidden />

      <button
        type="button"
        draggable={false}
        onClick={() => onTab("fruit")}
        onDragOver={(e) => onDragOverShelf("fruit", e)}
        onDrop={(e) => onDropShelf("fruit", e)}
        className={shelfCardClass("fruit", tab, dragOver === "fruit")}
        aria-label={`Fruit locker, ${fruitCount} links`}
      >
        <span className="flex shrink-0 opacity-90" aria-hidden>
          <IconFruitLocker className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5" />
        </span>
        <Count n={fruitCount} />
      </button>
    </aside>
  );
}
