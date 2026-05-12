"use client";

import Image from "next/image";

type Props = {
  disabled?: boolean;
  onPaste: () => void;
  /** Fixed bottom bar on native iOS — tighter chrome, no extra vertical margin. */
  variant?: "grid" | "floating";
};

/** Paste CTA — intentionally button-like (not a content card). */
export function FridgePastePlusCard({ disabled, onPaste, variant = "grid" }: Props) {
  const floating = variant === "floating";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onPaste()}
      className={`relative mx-auto flex items-center justify-center transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
        floating ? "mt-0 mb-0" : "group mt-5 mb-3 hover:scale-[1.02]"
      }`}
      aria-label="Paste link from clipboard"
    >
      {!floating ? (
        <span
          className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-200/55 via-cyan-100/40 to-emerald-200/50 opacity-90 blur-[10px] transition duration-300 group-hover:opacity-100 group-hover:blur-[12px] group-disabled:opacity-40"
          aria-hidden
        />
      ) : null}
      <Image
        src="/paste button.png"
        alt=""
        width={104}
        height={104}
        className={`relative z-0 object-contain ${floating ? "h-[5.25rem] w-[5.25rem]" : "h-24 w-24 drop-shadow-sm"}`}
      />
    </button>
  );
}
