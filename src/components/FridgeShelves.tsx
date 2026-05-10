"use client";

import type { ShelfTab } from "@/types/linkfridge";
import type { DragEvent } from "react";
import { useCallback } from "react";
import { IconChevronLeft, IconClipboard, IconSnowflake, IconTrash } from "./icons";

type Props = {
  tab: ShelfTab;
  onTab: (t: ShelfTab) => void;
  frozenCount: number;
  trashCount: number;
  dragOver: ShelfTab | null;
  onDragOverShelf: (shelf: ShelfTab, e: DragEvent<Element>) => void;
  onDropShelf: (shelf: ShelfTab, e: DragEvent<Element>) => void;
  onQuickPaste: () => void | Promise<void>;
  pasteBusy: boolean;
  pasteError: string | null;
  dueReminderLine?: React.ReactNode;
};

function shelfBtnClass(shelf: "freezer" | "trash", selected: boolean, dragOver: boolean) {
  const base =
    "flex min-h-[4rem] flex-1 min-w-0 items-center justify-center gap-2.5 rounded-2xl border-0 py-4 px-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  if (dragOver) {
    return `${base} ring-2 ring-moo-accent/55 ${
      shelf === "freezer" ? "bg-sky-300/95 text-sky-950" : "bg-stone-400/90 text-stone-950"
    }`;
  }

  if (shelf === "freezer") {
    if (selected) return `${base} bg-sky-300/90 text-sky-950 shadow-md`;
    return `${base} bg-sky-100/95 text-sky-900 hover:bg-sky-200/90`;
  }

  if (selected) return `${base} bg-stone-400/90 text-stone-950 shadow-md`;
  return `${base} bg-stone-200/95 text-stone-900 hover:bg-stone-300/90`;
}

export function FridgeShelves({
  tab,
  onTab,
  frozenCount,
  trashCount,
  dragOver,
  onDragOverShelf,
  onDropShelf,
  onQuickPaste,
  pasteBusy,
  pasteError,
  dueReminderLine,
}: Props) {
  const onPasteClick = useCallback(async () => {
    await onQuickPaste();
  }, [onQuickPaste]);

  return (
    <div className="mb-4 space-y-3">
      {tab === "fridge" ? (
        <div className="space-y-1.5">
          <div className="flex w-full items-stretch gap-2 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => onTab("freezer")}
              onDragOver={(e) => onDragOverShelf("freezer", e)}
              onDrop={(e) => onDropShelf("freezer", e)}
              className={shelfBtnClass("freezer", false, dragOver === "freezer")}
              aria-label={`Freezer, ${frozenCount} saved links`}
            >
              <span className="flex shrink-0 opacity-80" aria-hidden>
                <IconSnowflake className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">{frozenCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onTab("trash")}
              onDragOver={(e) => onDragOverShelf("trash", e)}
              onDrop={(e) => onDropShelf("trash", e)}
              className={shelfBtnClass("trash", false, dragOver === "trash")}
              aria-label={`Trash, ${trashCount} items in bin`}
            >
              <span className="flex shrink-0 opacity-80" aria-hidden>
                <IconTrash className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">{trashCount}</span>
            </button>

            <button
              type="button"
              onClick={() => void onPasteClick()}
              disabled={pasteBusy}
              className="flex h-auto min-h-[4rem] w-[4.25rem] shrink-0 flex-col items-center justify-center self-stretch rounded-2xl border border-white/30 bg-gradient-to-b from-[#0077ed] to-moo-accent text-white shadow-apple-lg transition enabled:hover:brightness-105 enabled:active:brightness-95 disabled:opacity-55 sm:w-[4.75rem] md:w-20"
              title="Paste link from clipboard"
              aria-label="Paste link from clipboard"
            >
              {pasteBusy ? (
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
              ) : (
                <IconClipboard className="h-8 w-8 shrink-0 opacity-95 md:h-9 md:w-9" />
              )}
            </button>
          </div>
          {pasteError != null && pasteError !== "" ? (
            <p className="px-0.5 text-xs text-red-600" role="alert">
              {pasteError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 overflow-visible py-1.5">
          <div className="flex min-w-0 justify-start">
            <button
              type="button"
              onClick={() => onTab("fridge")}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1.5 text-xs font-medium text-moo-brown transition hover:bg-black/[0.04] hover:text-moo-dark"
              aria-label="Back to fridge"
            >
              <IconChevronLeft className="h-3.5 w-3.5 shrink-0 opacity-80" />
              Back
            </button>
          </div>
          <div className="pointer-events-none relative mx-auto inline-block min-w-0 max-w-[min(72vw,17rem)] sm:max-w-none">
            <span
              className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-[42%] flex-col items-center"
              aria-hidden
            >
              <span className="h-3 w-3 rounded-full bg-red-600 shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-[0.5px] ring-red-900/25" />
              <span className="-mt-px h-1.5 w-[3px] rounded-b-sm bg-red-800" />
            </span>
            <h2 className="relative z-0 rounded-[2px] bg-[#fff176] px-3.5 pb-2 pt-2.5 text-center text-base font-bold leading-none tracking-tight text-amber-950 shadow-sm sm:px-5 sm:text-lg sm:pb-2.5 sm:pt-3">
              <span className="inline-flex max-w-full items-center justify-center gap-2 truncate">
                {tab === "freezer" ? (
                  <>
                    <span>Freezer</span>
                    <span className="shrink-0 select-none text-[1.2em] leading-none" aria-hidden>
                      ❄️
                    </span>
                  </>
                ) : (
                  <>
                    <span>Trash</span>
                    <IconTrash className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  </>
                )}
              </span>
            </h2>
          </div>
          <div aria-hidden className="min-w-0" />
        </div>
      )}

      {tab === "fridge" && (
        <div className="space-y-3">
          {dueReminderLine}
        </div>
      )}
    </div>
  );
}
