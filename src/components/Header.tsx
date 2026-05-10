"use client";

import Link from "next/link";
import { useState } from "react";
import { IconLogOut, IconPlus, IconSettings } from "./icons";
import { LinkFridgeLogo } from "./LinkFridgeLogo";
import { LinkFridgeWordmark } from "./LinkFridgeWordmark";

export type ReminderInboxItem = {
  linkId: string;
  title: string;
  offsets: number[];
};

/** Fridge-door magnet look: soft dome, thick rim, slight tilt, lifts on hover. */
const magnetBase =
  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.05),0_3px_10px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_5px_0_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.1)] active:translate-y-0 active:shadow-[0_2px_0_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2";

const magnetAdd =
  `${magnetBase} border-sky-300/90 bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 text-sky-900 [-webkit-tap-highlight-color:transparent] rotate-[-3deg]`;

const magnetBell =
  `${magnetBase} border-amber-200/95 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 text-amber-950 [-webkit-tap-highlight-color:transparent] rotate-[2.5deg]`;

const magnetSettings =
  `${magnetBase} border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-100 text-emerald-950 [-webkit-tap-highlight-color:transparent] rotate-[-2deg]`;

const magnetExit =
  `${magnetBase} border-orange-200/95 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 text-orange-950 [-webkit-tap-highlight-color:transparent] rotate-[3deg]`;

type Props = {
  inbox: ReminderInboxItem[];
  onClearInbox: () => void;
  /** Demo mode: exit local session */
  demoExit?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddLink: () => void;
};

export function Header({
  inbox,
  onClearInbox,
  demoExit,
  searchQuery,
  onSearchChange,
  onOpenAddLink,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="z-20 flex-shrink-0 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 md:gap-x-3 md:px-6 md:py-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-1 text-moo-dark transition-opacity hover:opacity-80">
          <LinkFridgeLogo size={40} className="rounded-ios-icon" alt="" priority />
          <LinkFridgeWordmark
            heightClass="h-10 w-auto max-w-[min(100%,12.5rem)] sm:h-12 md:h-[3.35rem] sm:max-w-none"
            alt="LinkFridge"
            priority
          />
        </Link>

        <div className="flex min-w-0 flex-1 basis-[min(100%,18rem)] items-center justify-end gap-1.5 sm:gap-2 md:flex-nowrap">
          <label className="relative flex h-10 min-w-0 flex-1 basis-[10rem] items-center rounded-full border border-black/[0.08] bg-white/90 px-4 shadow-apple backdrop-blur-sm focus-within:border-moo-accent/35 focus-within:ring-2 focus-within:ring-moo-accent/25 md:max-w-md">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Dig fridge, freezer, trash…"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-moo-dark placeholder:text-moo-brown/60 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
              aria-label="Dig for links in fridge, freezer, and trash"
            />
          </label>

          <button
            type="button"
            onClick={onOpenAddLink}
            className={magnetAdd}
            title="Add link"
            aria-label="Add link"
          >
            <IconPlus className="h-[18px] w-[18px] shrink-0 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`${magnetBell} relative`}
              aria-label="Notifications"
              title="Reminders"
            >
              <svg
                className="h-[18px] w-[18px] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {inbox.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-2 ring-amber-50">
                  {inbox.length > 9 ? "9+" : inbox.length}
                </span>
              )}
            </button>
            {open && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30 cursor-default"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 top-full z-40 mt-2 w-80 max-h-72 overflow-auto rounded-2xl border border-black/8 bg-white p-3 text-left shadow-apple-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-moo-dark">Reminders</span>
                    {inbox.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onClearInbox();
                          setOpen(false);
                        }}
                        className="text-xs text-moo-accent hover:underline"
                      >
                        Clear list
                      </button>
                    )}
                  </div>
                  {inbox.length === 0 ? (
                    <p className="py-4 text-center text-sm text-moo-brown">No reminders yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {inbox.map((item) => (
                        <li
                          key={`${item.linkId}-${item.offsets.join(",")}-${item.title.slice(0, 8)}`}
                          className="rounded-xl border border-black/5 bg-moo-cream/80 px-3 py-2 text-sm"
                        >
                          <span className="line-clamp-2 font-medium text-moo-dark">{item.title}</span>
                          <span className="mt-1 block text-xs text-moo-brown">
                            Day {item.offsets.join(", ")} check-in
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <Link href="/settings" className={magnetSettings} title="Settings" aria-label="Settings">
            <IconSettings className="h-[18px] w-[18px] shrink-0 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]" />
          </Link>

          {demoExit && (
            <button
              type="button"
              onClick={demoExit}
              className={magnetExit}
              title="Exit demo"
              aria-label="Exit demo"
            >
              <IconLogOut className="h-[18px] w-[18px] shrink-0 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
