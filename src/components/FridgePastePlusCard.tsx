"use client";

import { IconClipboard } from "./icons";

type Props = {
  disabled?: boolean;
  onPaste: () => void;
};

/** Paste tile — same footprint as `FridgeLinkCard`, neutral gray surface. */
export function FridgePastePlusCard({ disabled, onPaste }: Props) {
  const surface = "bg-gray-100 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onPaste()}
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl transition hover:scale-[1.02] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.16)] active:scale-[100%] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${surface}`}
      aria-label="Paste link from clipboard"
    >
      <div className="flex aspect-video shrink-0 items-center justify-center bg-gray-100">
        <IconClipboard className="h-14 w-14 text-moo-accent drop-shadow-sm sm:h-16 sm:w-16" />
      </div>
      <div className="shrink-0 bg-gray-100 p-3" aria-hidden />
    </button>
  );
}
