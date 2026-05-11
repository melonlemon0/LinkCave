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
    `flex h-full w-full max-w-full flex-col items-center justify-center gap-0.5 rounded-2xl border-0 px-0.5 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:gap-1.5 md:px-1 md:py-[clamp(0.6rem,2.5dvh,1.45rem)]${dimInactive}`;

  const minFridge = "min-h-[4.35rem] md:min-h-[clamp(6rem,24dvh,11.5rem)]";
  const minCold = "min-h-[3.85rem] md:min-h-[clamp(4.75rem,17dvh,8.5rem)]";

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
    <aside className="sticky top-0 z-20 grid w-full shrink-0 select-none grid-cols-2 gap-2 border-b border-black/[0.06] bg-white/90 py-2 backdrop-blur-md md:top-2 md:h-full md:min-h-0 md:max-h-[calc(100dvh-1.25rem)] md:w-16 md:grid-cols-1 md:gap-2 md:self-start md:border-0 md:bg-transparent md:py-1 md:backdrop-blur-none md:grid-rows-[auto_minmax(0,1.38fr)_minmax(0,0.873fr)_auto_minmax(0,0.873fr)_auto_minmax(0,0.873fr)]">
      <NextLink
        href="/settings"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="col-span-2 flex h-11 w-full shrink-0 flex-col items-center justify-end rounded-2xl border-0 border-transparent bg-transparent pr-0.5 shadow-none hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:col-span-1 md:h-[clamp(2.75rem,7.5dvh,4.75rem)] md:items-center md:justify-center md:border md:border-black/[0.06] md:bg-gradient-to-b md:from-white md:via-white md:to-moo-cream/50 md:pr-0 md:shadow-sm md:hover:border-moo-accent/20 md:hover:shadow-md"
        aria-label="Settings"
        title="Settings"
      >
        <IconSettings className="h-5 w-5 text-moo-dark/75 md:h-[clamp(1.125rem,3.2dvh,1.375rem)] md:w-[clamp(1.125rem,3.2dvh,1.375rem)]" />
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

      <div className="hidden h-2 w-full shrink-0 md:block md:h-2.5" aria-hidden />

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

      <div className="hidden h-2 w-full shrink-0 md:block md:h-2.5" aria-hidden />

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
