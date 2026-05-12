"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Link } from "@/types/db";
import { getSingleUrl } from "@/lib/linkfridge/url-helpers";
import type { FrozenZone } from "@/types/linkfridge";
import { IconFridge, IconFruitLocker, IconMeatLocker, IconSnowflake } from "./icons";

type Props = {
  link: Link;
  onSave: (linkId: string, patch: { title: string; url: string }) => Promise<void>;
  onClose: () => void;
  /** From fridge: pick which cold shelf (closes modal on success). */
  onFreezeTo?: (zone: FrozenZone) => Promise<void>;
  onThaw?: () => Promise<void>;
  /** When link is already frozen: current shelf (for relocate UI). */
  activeFrozenZone?: FrozenZone | null;
  /** Move between cold shelves without closing the modal. */
  onRelocateFrozen?: (zone: FrozenZone) => Promise<void>;
  /** Pin / unpin on the current shelf (fridge or freezer). */
  onTogglePin?: () => Promise<void>;
  /** Native iOS: only freezer as cold storage in the UI (no meat/fruit pickers). */
  twoColdShelvesOnly?: boolean;
};

/** Match `FridgeShelves` shelf card backgrounds (default / non-selected). */
const bgFreezer = "bg-sky-100/95 text-sky-900 shadow-sm";
const bgMeat = "bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 text-rose-950 shadow-sm";
const bgFruit = "bg-gradient-to-br from-lime-100 via-emerald-50 to-yellow-50 text-lime-950 shadow-sm";
const bgFridge = "bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 text-moo-dark shadow-sm";

const shelfMoveBtn =
  "flex min-h-[4rem] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border-0 py-3 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45";

const zonePickBtn =
  "flex min-h-[3.35rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border-0 px-0.5 py-2 text-[10px] font-semibold leading-tight transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moo-accent/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 sm:min-h-[3.5rem] sm:text-[11px]";

export function EditLinkModal({
  link,
  onSave,
  onClose,
  onFreezeTo,
  onThaw,
  activeFrozenZone,
  onRelocateFrozen,
  onTogglePin,
  twoColdShelvesOnly = false,
}: Props) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [saving, setSaving] = useState(false);
  const [zoneBusy, setZoneBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(link.title);
    setUrl(link.url);
  }, [link]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const copyUrl = useCallback(async () => {
    const raw = getSingleUrl(url);
    if (!raw) return;
    try {
      await navigator.clipboard.writeText(raw);
      setUrlCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      setError("Could not copy — check clipboard permission.");
    }
  }, [url]);

  async function handleSave() {
    const t = title.trim();
    if (!t) return;
    const raw = getSingleUrl(url);
    if (!raw) {
      setError("Enter a valid URL (https://…).");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(link.id, { title: t, url: raw });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleFreezeTo(zone: FrozenZone) {
    if (!onFreezeTo) return;
    setError(null);
    setZoneBusy(true);
    try {
      await onFreezeTo(zone);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setZoneBusy(false);
    }
  }

  async function handleRelocate(zone: FrozenZone) {
    if (!onRelocateFrozen || activeFrozenZone == null) return;
    if (zone === activeFrozenZone) return;
    setError(null);
    setZoneBusy(true);
    try {
      await onRelocateFrozen(zone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setZoneBusy(false);
    }
  }

  async function handleThaw() {
    if (!onThaw) return;
    setError(null);
    setZoneBusy(true);
    try {
      await onThaw();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setZoneBusy(false);
    }
  }

  async function handleTogglePin() {
    if (!onTogglePin) return;
    setError(null);
    setPinBusy(true);
    try {
      await onTogglePin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update pin");
    } finally {
      setPinBusy(false);
    }
  }

  const busy = saving || zoneBusy || pinBusy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-black/8 bg-white shadow-apple-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-moo-brown transition hover:bg-black/[0.06] hover:text-moo-dark disabled:opacity-40"
          title="Close"
          aria-label="Close"
        >
          <span className="text-[1.35rem] font-light leading-none">×</span>
        </button>
        {onTogglePin ? (
          <button
            type="button"
            onClick={() => void handleTogglePin()}
            disabled={busy}
            className={`absolute right-14 top-3 z-10 flex h-9 min-w-9 items-center justify-center rounded-full px-2 leading-none transition disabled:opacity-40 ${
              link.pinned
                ? "bg-sky-50/90 text-sky-700"
                : "text-sky-500/70 hover:bg-sky-50/70 hover:text-sky-600"
            }`}
            title={link.pinned ? "Unpin" : "Pin"}
            aria-label={link.pinned ? "Unpin link" : "Pin link"}
          >
            <IconSnowflake className="h-4 w-4" />
          </button>
        ) : null}

        <div className="p-6 pt-7">
          <h3 className="mb-5 pr-10 text-lg font-semibold tracking-tight text-moo-dark">Edit link</h3>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-moo-brown/80">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              className="w-full rounded-2xl border border-black/5 bg-moo-cream/40 px-4 py-3 text-moo-dark shadow-inner placeholder:text-moo-brown/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-moo-accent/30 disabled:opacity-50"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-moo-brown/80">Link</label>
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={busy}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-2xl border border-black/5 bg-moo-cream/40 px-4 py-3 text-sm text-moo-dark shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-moo-accent/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void copyUrl()}
                disabled={busy || !url.trim()}
                className="shrink-0 rounded-2xl border border-black/5 bg-white px-3 py-3 text-xs font-semibold text-moo-accent shadow-apple transition hover:bg-moo-cream/50 disabled:opacity-40"
              >
                {urlCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {onFreezeTo ? (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-moo-brown/85">
                {twoColdShelvesOnly ? "Move to freezer" : "Move to a cold shelf"}
              </p>
              {twoColdShelvesOnly ? (
                <button
                  type="button"
                  onClick={() => void handleFreezeTo("freezer")}
                  disabled={busy}
                  className={`${zonePickBtn} ${bgFreezer} w-full max-w-none sm:min-h-[3.5rem]`}
                  title="Freezer"
                  aria-label="Move to freezer"
                >
                  <IconSnowflake className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                  <span>Freezer</span>
                </button>
              ) : (
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => void handleFreezeTo("freezer")}
                    disabled={busy}
                    className={`${zonePickBtn} ${bgFreezer}`}
                    title="Freezer"
                    aria-label="Move to freezer"
                  >
                    <IconSnowflake className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    <span>Freezer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFreezeTo("meat")}
                    disabled={busy}
                    className={`${zonePickBtn} ${bgMeat}`}
                    title="Meat locker"
                    aria-label="Move to meat locker"
                  >
                    <IconMeatLocker className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    <span>Meat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFreezeTo("fruit")}
                    disabled={busy}
                    className={`${zonePickBtn} ${bgFruit}`}
                    title="Fruit locker"
                    aria-label="Move to fruit locker"
                  >
                    <IconFruitLocker className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    <span>Fruit</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {onThaw ? (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => void handleThaw()}
                disabled={busy}
                className={`${shelfMoveBtn} ${bgFridge} w-full`}
                title="Move to fridge"
                aria-label="Move to fridge"
              >
                <span className="flex items-center gap-1.5 text-moo-brown/70">
                  <span className="text-sm font-semibold">→</span>
                  <IconFridge className="h-7 w-7 shrink-0 opacity-90 sm:h-8 sm:w-8" />
                </span>
              </button>
            </div>
          ) : null}

          {onRelocateFrozen && activeFrozenZone != null && !twoColdShelvesOnly ? (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-moo-brown/85">Switch cold shelf</p>
              <div className="flex gap-1.5 sm:gap-2">
                {(
                  [
                    { zone: "freezer" as const, label: "Freezer", className: bgFreezer, icon: "snow" as const },
                    { zone: "meat" as const, label: "Meat", className: bgMeat, icon: "meat" as const },
                    { zone: "fruit" as const, label: "Fruit", className: bgFruit, icon: "fruit" as const },
                  ] as const
                ).map(({ zone, label, className, icon }) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => void handleRelocate(zone)}
                    disabled={busy || zone === activeFrozenZone}
                    className={`${zonePickBtn} ${className} ${
                      zone === activeFrozenZone ? "ring-2 ring-moo-accent/50 ring-offset-1" : ""
                    }`}
                    title={zone === activeFrozenZone ? "Current shelf" : `Move to ${label}`}
                    aria-label={`Move to ${label}`}
                  >
                    {icon === "snow" ? (
                      <IconSnowflake className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    ) : icon === "meat" ? (
                      <IconMeatLocker className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    ) : (
                      <IconFruitLocker className="h-5 w-5 shrink-0 opacity-90 sm:h-6 sm:w-6" aria-hidden />
                    )}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !title.trim() || busy}
            className="w-full rounded-2xl bg-moo-dark py-3.5 text-sm font-semibold tracking-tight text-white shadow-apple transition hover:opacity-[0.92] active:opacity-100 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>

        </div>
      </div>
    </div>
  );
}
