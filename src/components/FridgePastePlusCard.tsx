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
      className="group relative mx-auto mt-5 mb-3 flex items-center justify-center transition hover:scale-[1.03] active:scale-[99%] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      aria-label="Paste link from clipboard"
    >
      <span
        className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-200/55 via-cyan-100/40 to-emerald-200/50 opacity-90 blur-[10px] transition duration-300 group-hover:opacity-100 group-hover:blur-[12px] group-disabled:opacity-40"
        aria-hidden
      />
      <Image
        src="/paste button.png"
        alt=""
        width={104}
        height={104}
        className="relative z-0 h-24 w-24 object-contain drop-shadow-sm"
      />
    </button>
  );
}
