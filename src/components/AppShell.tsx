"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { ensureUserProfile, subscribeUserSettings } from "@/lib/firebase/profile";
import {
  addUserLink,
  freezeLink,
  permanentDeleteLink,
  purgeExpiredTrash,
  recordReminderFired,
  setFrozenZone,
  setLinkPinned,
  subscribeActiveLinks,
  subscribeFrozenLinks,
  unfreezeLink,
  updateLinkDetails,
} from "@/lib/firebase/links-repo";
import {
  isDemoSignedIn,
  loadDemoPayload,
  newDemoLink,
  saveDemoPayload,
} from "@/lib/local/demo-store";
import { fetchLinkPreview } from "@/lib/linkfridge/fetch-link-preview";
import { normalizeLinkUrl } from "@/lib/linkfridge/url-helpers";
import { countDueReminders, getPendingReminderOffsets } from "@/lib/linkfridge/reminders";
import { sortActiveShelfLinks, sortFrozenShelfLinks } from "@/lib/linkfridge/sort-shelf-links";
import { fridgeLinkToUiLink } from "@/lib/linkfridge/to-ui-link";
import { linkFrozenZone, type FridgeLink, type FrozenZone, type ShelfTab, type UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS } from "@/types/linkfridge";
import { useRouter } from "next/navigation";
import type { DragEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppLoadingScreen } from "./AppLoadingScreen";
import { FridgeLinkCard } from "./FridgeLinkCard";
import { FridgePastePlusCard } from "./FridgePastePlusCard";
import { FridgeShelves } from "./FridgeShelves";
import { EditLinkModal } from "./EditLinkModal";

type ReminderInboxItem = {
  linkId: string;
  title: string;
  offsets: number[];
};

function isColdShelfTab(x: unknown): x is Exclude<ShelfTab, "fridge"> {
  return x === "freezer" || x === "meat" || x === "fruit";
}

function parseDragPayload(e: DragEvent<Element>): { linkId: string; from: ShelfTab } | null {
  try {
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return null;
    const o = JSON.parse(raw) as { linkId?: unknown; from?: unknown };
    if (typeof o.linkId !== "string") return null;
    const from = o.from;
    if (from !== "fridge" && !isColdShelfTab(from)) return null;
    return { linkId: o.linkId, from };
  } catch {
    return null;
  }
}

export function AppShell() {
  const { user, loading: authLoading, configured } = useAuth();
  const router = useRouter();
  /** Start false so SSR + first client paint match; sync from localStorage before paint (avoids hydration mismatch). */
  const [demoMode, setDemoMode] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [demoHydrated, setDemoHydrated] = useState(false);

  useLayoutEffect(() => {
    setDemoMode(isDemoSignedIn());
    setShellReady(true);
  }, []);

  const [tab, setTab] = useState<ShelfTab>("fridge");
  const [dragOver, setDragOver] = useState<ShelfTab | null>(null);
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [activeLinks, setActiveLinks] = useState<FridgeLink[]>([]);
  const [frozenLinks, setFrozenLinks] = useState<FridgeLink[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
    notificationsEnabled: true,
  });
  const [editingLink, setEditingLink] = useState<FridgeLink | null>(null);
  const [inbox, setInbox] = useState<ReminderInboxItem[]>([]);
  const reminderDedupe = useRef(new Set<string>());

  useEffect(() => {
    if (!demoMode) return;
    try {
      const p = loadDemoPayload();
      const active = sortActiveShelfLinks(p.links.filter((l) => l.state === "active"));
      const frozen = sortFrozenShelfLinks(p.links.filter((l) => l.state === "frozen"));
      setActiveLinks(active);
      setFrozenLinks(frozen);
      setSettings(p.settings);
    } catch {
      setActiveLinks([]);
      setFrozenLinks([]);
      setSettings({
        reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
        notificationsEnabled: true,
      });
    } finally {
      setDemoHydrated(true);
    }
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode || !demoHydrated) return;
    saveDemoPayload({ links: [...activeLinks, ...frozenLinks], settings });
  }, [demoMode, demoHydrated, activeLinks, frozenLinks, settings]);

  useEffect(() => {
    if (typeof window !== "undefined" && isDemoSignedIn()) return;
    if (demoMode) return;
    if (authLoading) return;
    if (!configured || !user) {
      router.replace("/login");
      return;
    }
    void ensureUserProfile(user.uid, user.email);
    void purgeExpiredTrash(user.uid);
  }, [demoMode, authLoading, configured, user, router]);

  useEffect(() => {
    if (demoMode || !user) return;
    const unsubA = subscribeActiveLinks(user.uid, setActiveLinks);
    const unsubF = subscribeFrozenLinks(user.uid, setFrozenLinks);
    const unsubS = subscribeUserSettings(user.uid, setSettings);
    return () => {
      unsubA();
      unsubF();
      unsubS();
    };
  }, [demoMode, user]);

  useEffect(() => {
    const clear = () => setDragOver(null);
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  const gridLinks = useMemo(() => {
    if (tab === "fridge") return activeLinks;
    return sortFrozenShelfLinks(frozenLinks.filter((l) => linkFrozenZone(l) === tab));
  }, [tab, activeLinks, frozenLinks]);

  const freezerCount = useMemo(
    () => frozenLinks.filter((l) => linkFrozenZone(l) === "freezer").length,
    [frozenLinks]
  );
  const meatCount = useMemo(
    () => frozenLinks.filter((l) => linkFrozenZone(l) === "meat").length,
    [frozenLinks]
  );
  const fruitCount = useMemo(
    () => frozenLinks.filter((l) => linkFrozenZone(l) === "fruit").length,
    [frozenLinks]
  );

  const displayRows = useMemo(
    () => gridLinks.map((link) => ({ link, shelf: tab })),
    [gridLinks, tab]
  );

  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    if (demoMode) {
      const firedPerLink = new Map<string, number[]>();
      for (const link of activeLinks) {
        const pending = getPendingReminderOffsets(link, settings);
        for (const offset of pending) {
          const key = `${link.id}-${offset}`;
          if (reminderDedupe.current.has(key)) continue;
          reminderDedupe.current.add(key);
          const arr = firedPerLink.get(link.id) ?? [];
          arr.push(offset);
          firedPerLink.set(link.id, arr);
          setInbox((prev) =>
            [{ linkId: link.id, title: link.title, offsets: [offset] }, ...prev].slice(0, 50)
          );
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`Reminder — day ${offset}`, { body: link.title });
          }
        }
      }
      if (firedPerLink.size > 0) {
        setActiveLinks((prev) =>
          prev.map((l) => {
            const add = firedPerLink.get(l.id);
            if (!add?.length) return l;
            return { ...l, reminderFiredOffsets: [...l.reminderFiredOffsets, ...add] };
          })
        );
      }
      return;
    }

    if (!user) return;
    const uid = user.uid;
    let cancelled = false;
    void (async () => {
      for (const link of activeLinks) {
        if (!settings.notificationsEnabled) break;
        const pending = getPendingReminderOffsets(link, settings);
        for (const offset of pending) {
          const key = `${link.id}-${offset}`;
          if (reminderDedupe.current.has(key)) continue;
          reminderDedupe.current.add(key);
          try {
            await recordReminderFired(uid, link.id, offset);
            if (cancelled) return;
            setInbox((prev) =>
              [{ linkId: link.id, title: link.title, offsets: [offset] }, ...prev].slice(0, 50)
            );
            if (
              settings.notificationsEnabled &&
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification(`Reminder — day ${offset}`, { body: link.title });
            }
          } catch {
            reminderDedupe.current.delete(key);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLinks, settings, user, demoMode]);

  const dueCount = useMemo(
    () => countDueReminders(activeLinks, settings),
    [activeLinks, settings]
  );

  const onClearInbox = useCallback(() => setInbox([]), []);

  const handleAdd = useCallback(
    async (input: { url: string; title: string; thumbnailUrl: string | null }) => {
      if (demoMode) {
        setActiveLinks((prev) => sortActiveShelfLinks([newDemoLink(input), ...prev]));
        return;
      }
      if (!user) return;
      await addUserLink(user.uid, input);
    },
    [demoMode, user]
  );

  const handleSaveLink = useCallback(
    async (linkId: string, patch: { title: string; url: string }) => {
      const url = normalizeLinkUrl(patch.url);
      if (demoMode) {
        const apply = (l: FridgeLink) =>
          l.id === linkId ? { ...l, title: patch.title, url } : l;
        setActiveLinks((prev) => prev.map(apply));
        setFrozenLinks((prev) => prev.map(apply));
        return;
      }
      if (!user) return;
      await updateLinkDetails(user.uid, linkId, { title: patch.title, url });
    },
    [demoMode, user]
  );

  const handleTogglePin = useCallback(
    async (linkId: string) => {
      const found = activeLinks.find((l) => l.id === linkId) ?? frozenLinks.find((l) => l.id === linkId);
      if (!found) return;
      const next = !found.pinned;
      setEditingLink((prev) => (prev?.id === linkId ? { ...prev, pinned: next } : prev));

      if (demoMode) {
        const flip = (l: FridgeLink) => (l.id === linkId ? { ...l, pinned: next } : l);
        setActiveLinks((prev) =>
          prev.some((l) => l.id === linkId) ? sortActiveShelfLinks(prev.map(flip)) : prev
        );
        setFrozenLinks((prev) =>
          prev.some((l) => l.id === linkId) ? sortFrozenShelfLinks(prev.map(flip)) : prev
        );
        return;
      }
      if (!user) return;
      await setLinkPinned(user.uid, linkId, next);
    },
    [demoMode, user, activeLinks, frozenLinks]
  );

  const handleFreeze = useCallback(
    async (linkId: string, zone: FrozenZone = "freezer") => {
      const moved = activeLinks.find((l) => l.id === linkId);
      if (!moved) return;
      const now = Date.now();
      const optimistic: FridgeLink = {
        ...moved,
        state: "frozen",
        frozenAt: now,
        trashedAt: null,
        frozenZone: zone,
      };

      if (demoMode) {
        setActiveLinks((p) => p.filter((l) => l.id !== linkId));
        setFrozenLinks((fp) => sortFrozenShelfLinks([optimistic, ...fp]));
        return;
      }
      if (!user) return;
      setActiveLinks((p) => p.filter((l) => l.id !== linkId));
      setFrozenLinks((fp) => sortFrozenShelfLinks([optimistic, ...fp]));
      try {
        await freezeLink(user.uid, linkId, zone);
      } catch {
        setFrozenLinks((fp) => fp.filter((l) => l.id !== linkId));
        setActiveLinks((ap) => sortActiveShelfLinks([moved, ...ap]));
      }
    },
    [demoMode, user, activeLinks]
  );

  const handleMoveFrozenZone = useCallback(
    async (linkId: string, zone: FrozenZone) => {
      if (demoMode) {
        setFrozenLinks((prev) =>
          sortFrozenShelfLinks(prev.map((l) => (l.id === linkId ? { ...l, frozenZone: zone } : l)))
        );
        return;
      }
      if (!user) return;
      const prev = frozenLinks.find((l) => l.id === linkId);
      if (!prev) return;
      const previousZone = linkFrozenZone(prev);
      setFrozenLinks((p) =>
        sortFrozenShelfLinks(p.map((l) => (l.id === linkId ? { ...l, frozenZone: zone } : l)))
      );
      try {
        await setFrozenZone(user.uid, linkId, zone);
      } catch {
        setFrozenLinks((p) =>
          sortFrozenShelfLinks(
            p.map((l) => (l.id === linkId ? { ...l, frozenZone: previousZone } : l))
          )
        );
      }
    },
    [demoMode, user, frozenLinks]
  );

  const handleUnfreeze = useCallback(
    async (linkId: string) => {
      const moved = frozenLinks.find((l) => l.id === linkId);
      if (!moved) return;
      const frozenSnapshot = { ...moved };
      const optimisticActive: FridgeLink = {
        ...moved,
        state: "active",
        frozenAt: null,
        frozenZone: null,
        trashedAt: null,
      };

      if (demoMode) {
        setFrozenLinks((p) => p.filter((l) => l.id !== linkId));
        setActiveLinks((ap) => sortActiveShelfLinks([optimisticActive, ...ap]));
        return;
      }
      if (!user) return;
      setFrozenLinks((p) => p.filter((l) => l.id !== linkId));
      setActiveLinks((ap) => sortActiveShelfLinks([optimisticActive, ...ap]));
      try {
        await unfreezeLink(user.uid, linkId);
      } catch {
        setActiveLinks((ap) => ap.filter((l) => l.id !== linkId));
        setFrozenLinks((fp) => sortFrozenShelfLinks([frozenSnapshot, ...fp]));
      }
    },
    [demoMode, user, frozenLinks]
  );

  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        setActiveLinks((p) => p.filter((l) => l.id !== linkId));
        setFrozenLinks((p) => p.filter((l) => l.id !== linkId));
        return;
      }
      if (!user) return;
      await permanentDeleteLink(user.uid, linkId);
    },
    [demoMode, user]
  );

  const onQuickPaste = useCallback(async () => {
    setPasteError(null);
    setPasteBusy(true);
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        setPasteError("Clipboard unavailable — allow permission in the browser, then try again.");
        return;
      }
      const preview = await fetchLinkPreview(text);
      await handleAdd(preview);
      setTab("fridge");
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPasteBusy(false);
    }
  }, [handleAdd]);

  const onDragOverShelf = useCallback((shelf: ShelfTab, e: DragEvent<Element>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(shelf);
  }, []);

  const onDropShelf = useCallback(
    (target: ShelfTab, e: DragEvent<Element>) => {
      e.preventDefault();
      setDragOver(null);
      const payload = parseDragPayload(e);
      if (!payload) return;
      const { linkId, from } = payload;

      if (target === "fridge") {
        if (from !== "fridge") void handleUnfreeze(linkId);
        return;
      }
      if (isColdShelfTab(target)) {
        if (from === "fridge") void handleFreeze(linkId, target);
        else if (from !== target) void handleMoveFrozenZone(linkId, target);
      }
    },
    [handleFreeze, handleMoveFrozenZone, handleUnfreeze]
  );

  if (!shellReady) {
    return <AppLoadingScreen message="Loading…" />;
  }

  if (demoMode) {
    if (!demoHydrated) {
      return <AppLoadingScreen message="Opening your fridge…" />;
    }
  } else {
    if (authLoading && configured) {
      return <AppLoadingScreen message="Signing you in…" />;
    }
    if (!configured || !user) {
      return null;
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-white">
      <main className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col px-2 pb-8 pt-2 sm:px-3 md:px-4 md:pb-10">
        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-2 sm:gap-3 md:flex-row md:gap-4">
          <FridgeShelves
            tab={tab}
            onTab={setTab}
            fridgeCount={activeLinks.length}
            frozenCount={freezerCount}
            meatCount={meatCount}
            fruitCount={fruitCount}
            dragOver={dragOver}
            onDragOverShelf={onDragOverShelf}
            onDropShelf={onDropShelf}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {inbox.length > 0 ? (
              <div className="mb-2 flex flex-wrap items-start gap-x-2 gap-y-1.5 rounded-xl border border-black/[0.06] bg-moo-cream/40 px-2.5 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-moo-brown">Reminders</span>
                <ul className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {inbox.map((item) => (
                    <li
                      key={`${item.linkId}-${item.offsets.join(",")}-${item.title.slice(0, 8)}`}
                      className="max-w-[12rem] truncate rounded-md border border-black/5 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-moo-dark"
                      title={item.title}
                    >
                      {item.title}
                      <span className="ml-1 text-[10px] font-normal text-moo-brown">day {item.offsets.join(", ")}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onClearInbox}
                  className="shrink-0 text-[11px] font-semibold text-moo-accent hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : null}

            {dueCount > 0 ? (
              <p className="mb-2 text-sm text-moo-brown">
                {dueCount} reminder{dueCount === 1 ? "" : "s"} due in the fridge — when they fire, they appear in the list above.
              </p>
            ) : null}

            <div
              className={`flex min-h-0 flex-1 flex-col rounded-2xl transition ${
                tab !== "fridge" && dragOver === "fridge"
                  ? "ring-2 ring-moo-accent/45 ring-offset-2 ring-offset-white"
                  : ""
              }`}
              onDragOver={(e) => {
                if (tab === "fridge") return;
                onDragOverShelf("fridge", e);
              }}
              onDrop={(e) => {
                if (tab === "fridge") return;
                onDropShelf("fridge", e);
              }}
            >
              {gridLinks.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-black/10 bg-white/50 p-6 text-center text-moo-brown sm:p-8">
                  {tab === "fridge" ? (
                    <div className="h-48 w-full max-w-[12rem] shrink-0 sm:h-52">
                      <FridgePastePlusCard onPaste={onQuickPaste} disabled={pasteBusy} />
                    </div>
                  ) : (
                    <p className="max-w-md text-sm leading-relaxed">
                      {tab === "freezer" ? (
                        <>
                          Nothing in the freezer. Drag from the fridge onto the{" "}
                          <strong className="text-moo-dark">snowflake</strong> shelf, or use Edit link to pick a cold
                          shelf.
                        </>
                      ) : tab === "meat" ? (
                        <>
                          Meat locker is empty. Drag from the fridge onto the{" "}
                          <strong className="text-moo-dark">meat locker</strong> shelf, or use Edit link.
                        </>
                      ) : (
                        <>
                          Fruit locker is empty. Drag from the fridge onto the{" "}
                          <strong className="text-moo-dark">fruit locker</strong> shelf, or use Edit link.
                        </>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto pb-6 pt-2 sm:pt-2.5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {tab === "fridge" ? (
                      <div key="__paste_plus__" className="flex min-h-0 h-full min-w-0 flex-col">
                        <FridgePastePlusCard onPaste={onQuickPaste} disabled={pasteBusy} />
                      </div>
                    ) : null}
                    {displayRows.map(({ link, shelf }) => (
                      <div key={link.id} className="flex min-h-0 h-full min-w-0 flex-col space-y-2">
                        <FridgeLinkCard
                          link={link}
                          dragSource={shelf}
                          onEdit={setEditingLink}
                          onDelete={(l) => void handleDeleteLink(l.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {editingLink && (
        <EditLinkModal
          link={fridgeLinkToUiLink(editingLink)}
          onSave={handleSaveLink}
          onClose={() => setEditingLink(null)}
          onTogglePin={async () => {
            await handleTogglePin(editingLink.id);
          }}
          activeFrozenZone={editingLink.state === "frozen" ? linkFrozenZone(editingLink) : null}
          onFreezeTo={
            editingLink.state === "active"
              ? async (zone) => {
                  await handleFreeze(editingLink.id, zone);
                }
              : undefined
          }
          onThaw={
            editingLink.state === "frozen"
              ? async () => {
                  await handleUnfreeze(editingLink.id);
                }
              : undefined
          }
          onRelocateFrozen={
            editingLink.state === "frozen"
              ? async (zone) => {
                  await handleMoveFrozenZone(editingLink.id, zone);
                }
              : undefined
          }
        />
      )}

      {pasteError != null && pasteError !== "" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
          <p
            className="pointer-events-auto max-w-md rounded-2xl border border-red-200/80 bg-red-50/95 px-4 py-2.5 text-center text-xs leading-snug text-red-800 shadow-lg backdrop-blur-sm"
            role="alert"
          >
            {pasteError}
          </p>
        </div>
      ) : null}
    </div>
  );
}
