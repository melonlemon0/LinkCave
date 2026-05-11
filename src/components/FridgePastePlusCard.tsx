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
      {/* Wide soft halo */}
      <span
        className="pointer-events-none absolute -inset-6 -z-20 rounded-[2.75rem] bg-gradient-to-br from-sky-200/45 via-cyan-50/25 to-emerald-200/40 opacity-80 blur-[18px] transition duration-300 group-hover:opacity-100 group-hover:blur-[22px] group-disabled:opacity-35"
        aria-hidden
      />
      {/* Tighter brighter core */}
      <span
        className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-300/65 via-cyan-200/50 to-emerald-300/55 opacity-95 blur-[12px] transition duration-300 group-hover:opacity-100 group-hover:blur-[14px] group-disabled:opacity-40"
        aria-hidden
      />
      <Image
        src="/paste button.png"
        alt=""
        width={104}
        height={104}
        className="relative z-0 h-24 w-24 object-contain drop-shadow-sm transition duration-300 group-hover:drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      />
    </button>
  );
}
