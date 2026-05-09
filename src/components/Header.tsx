"use client";

import Link from "next/link";
import { useState } from "react";

export type ReminderInboxItem = {
  linkId: string;
  title: string;
  offsets: number[];
};

type Props = {
  inbox: ReminderInboxItem[];
  onClearInbox: () => void;
  /** Demo mode: exit local session */
  demoExit?: () => void;
};

export function Header({ inbox, onClearInbox, demoExit }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex-shrink-0 z-20 flex items-center justify-between gap-3 px-4 md:px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-black/5">
      <Link href="/" className="flex items-center gap-2 text-moo-dark hover:opacity-80 transition-opacity min-w-0">
        <span className="text-2xl" aria-hidden>
          🧊
        </span>
        <span className="font-semibold text-lg tracking-tight truncate">LinkFridge</span>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative p-2 rounded-xl border border-black/8 hover:bg-black/5 transition"
            aria-label="Notifications"
            title="Reminders"
          >
            <span className="text-lg" aria-hidden>
              🔔
            </span>
            {inbox.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-moo-accent text-white text-[10px] font-semibold">
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
              <div className="absolute right-0 top-full mt-2 w-80 max-h-72 overflow-auto z-40 rounded-2xl border border-black/8 bg-white shadow-apple-lg p-3 text-left">
                <div className="flex items-center justify-between mb-2">
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
                  <p className="text-sm text-moo-brown py-4 text-center">No reminders yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {inbox.map((item) => (
                      <li
                        key={`${item.linkId}-${item.offsets.join(",")}-${item.title.slice(0, 8)}`}
                        className="text-sm rounded-xl bg-moo-cream/80 px-3 py-2 border border-black/5"
                      >
                        <span className="font-medium text-moo-dark line-clamp-2">{item.title}</span>
                        <span className="block text-xs text-moo-brown mt-1">
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
        <Link
          href="/settings"
          className="text-sm text-moo-brown hover:text-moo-dark px-2 py-1.5 rounded-lg hover:bg-black/5"
        >
          Settings
        </Link>
        {demoExit && (
          <button
            type="button"
            onClick={demoExit}
            className="text-sm text-moo-brown hover:text-moo-dark px-2 py-1.5 rounded-lg hover:bg-black/5"
          >
            Exit demo
          </button>
        )}
      </div>
    </header>
  );
}
