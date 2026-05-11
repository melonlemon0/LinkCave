"use client";

import Image from "next/image";

type Props = {
  disabled?: boolean;
  onPaste: () => void;
};

/** Paste CTA — intentionally button-like (not a content card). */
export function FridgePastePlusCard({ disabled, onPaste }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onPaste()}
      className="group relative mx-auto my-1 flex w-full max-w-full items-center justify-center transition hover:scale-[1.03] active:scale-[99%] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:my-4"
      aria-label="Paste link from clipboard"
    >
      <span
        className="pointer-events-none absolute -inset-1 -z-10 rounded-[1.25rem] bg-gradient-to-br from-sky-200/55 via-cyan-100/40 to-emerald-200/50 opacity-90 blur-[8px] transition duration-300 group-hover:opacity-100 group-hover:blur-[10px] group-disabled:opacity-40 sm:-inset-2 sm:rounded-[2rem] sm:blur-[10px] sm:group-hover:blur-[12px]"
        aria-hidden
      />
      <Image
        src="/paste button.png"
        alt=""
        width={104}
        height={104}
        className="relative z-0 h-14 w-14 object-contain drop-shadow-sm sm:h-24 sm:w-24"
      />
    </button>
  );
}
