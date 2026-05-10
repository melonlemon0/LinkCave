"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { ensureUserProfile, subscribeUserSettings } from "@/lib/firebase/profile";
import {
  addUserLink,
  freezeLink,
  permanentDeleteLink,
  purgeExpiredTrash,
  recordReminderFired,
  restoreLink,
  setLinkPinned,
  softTrashLink,
  subscribeActiveLinks,
  subscribeFrozenLinks,
  subscribeTrashedLinks,
  unfreezeLink,
  updateLinkTitle,
} from "@/lib/firebase/links-repo";
import {
  isDemoSignedIn,
  loadDemoPayload,
  newDemoLink,
  saveDemoPayload,
  signOutDemo,
} from "@/lib/local/demo-store";
import { fetchLinkPreview } from "@/lib/linkfridge/fetch-link-preview";
import { countDueReminders, getPendingReminderOffsets } from "@/lib/linkfridge/reminders";
import { sortActiveShelfLinks, sortFrozenShelfLinks } from "@/lib/linkfridge/sort-shelf-links";
import { fridgeLinkToUiLink } from "@/lib/linkfridge/to-ui-link";
import { TRASH_RETENTION_MS, type FridgeLink, type ShelfTab, type UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS } from "@/types/linkfridge";
import { useRouter } from "next/navigation";
import type { DragEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppLoadingScreen } from "./AppLoadingScreen";
import { Header, type ReminderInboxItem } from "./Header";
import { AddLinkModal } from "./AddLinkModal";
import { FridgeLinkCard } from "./FridgeLinkCard";
import { FridgeShelves } from "./FridgeShelves";
import { EditLinkModal } from "./EditLinkModal";

function parseDragPayload(e: DragEvent<Element>): { linkId: string; from: ShelfTab } | null {
  try {
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return null;
    const o = JSON.parse(raw) as { linkId?: unknown; from?: unknown };
    if (typeof o.linkId !== "string") return null;
    const from = o.from;
    if (from !== "fridge" && from !== "freezer" && from !== "trash") return null;
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
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [activeLinks, setActiveLinks] = useState<FridgeLink[]>([]);
  const [frozenLinks, setFrozenLinks] = useState<FridgeLink[]>([]);
  const [trashedLinks, setTrashedLinks] = useState<FridgeLink[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
    notificationsEnabled: true,
  });
  const [editingLink, setEditingLink] = useState<FridgeLink | null>(null);
  const [inbox, setInbox] = useState<ReminderInboxItem[]>([]);
  const [linkSearch, setLinkSearch] = useState("");
  const reminderDedupe = useRef(new Set<string>());

  useEffect(() => {
    if (!demoMode) return;
    try {
      const p = loadDemoPayload();
      const active = sortActiveShelfLinks(p.links.filter((l) => l.state === "active"));
      const frozen = sortFrozenShelfLinks(p.links.filter((l) => l.state === "frozen"));
      const trashed = p.links.filter((l) => l.state === "trashed").sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
      setActiveLinks(active);
      setFrozenLinks(frozen);
      setTrashedLinks(trashed);
      setSettings(p.settings);
    } catch {
      setActiveLinks([]);
      setFrozenLinks([]);
      setTrashedLinks([]);
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
    saveDemoPayload({ links: [...activeLinks, ...frozenLinks, ...trashedLinks], settings });
  }, [demoMode, demoHydrated, activeLinks, frozenLinks, trashedLinks, settings]);

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
    const unsubT = subscribeTrashedLinks(user.uid, setTrashedLinks);
    const unsubS = subscribeUserSettings(user.uid, setSettings);
    return () => {
      unsubA();
      unsubF();
      unsubT();
      unsubS();
    };
  }, [demoMode, user]);

  useEffect(() => {
    const clear = () => setDragOver(null);
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  const recoverableTrash = useMemo(() => {
    const now = Date.now();
    return trashedLinks.filter((l) => {
      if (l.trashedAt == null) return false;
      return now - l.trashedAt < TRASH_RETENTION_MS;
    });
  }, [trashedLinks]);

  const gridLinks =
    tab === "fridge" ? activeLinks : tab === "freezer" ? frozenLinks : recoverableTrash;

  /** With a dig query, match across fridge + freezer + trash; otherwise current tab only. */
  const displayRows = useMemo(() => {
    const q = linkSearch.trim().toLowerCase();
    if (!q) {
      return gridLinks.map((link) => ({ link, shelf: tab }));
    }
    const rows: { link: FridgeLink; shelf: ShelfTab }[] = [];
    const pushIfMatch = (link: FridgeLink, shelf: ShelfTab) => {
      if (link.title.toLowerCase().includes(q) || link.url.toLowerCase().includes(q)) {
        rows.push({ link, shelf });
      }
    };
    for (const link of activeLinks) pushIfMatch(link, "fridge");
    for (const link of frozenLinks) pushIfMatch(link, "freezer");
    for (const link of recoverableTrash) pushIfMatch(link, "trash");
    rows.sort((a, b) => {
      const pa = a.link.pinned ? 1 : 0;
      const pb = b.link.pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return b.link.createdAt - a.link.createdAt;
    });
    return rows;
  }, [linkSearch, tab, gridLinks, activeLinks, frozenLinks, recoverableTrash]);

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
            new Notification(`LinkFridge — day ${offset}`, { body: link.title });
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
              new Notification(`LinkFridge — day ${offset}`, { body: link.title });
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

  const handleSaveTitle = useCallback(
    async (linkId: string, title: string) => {
      if (demoMode) {
        setActiveLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, title } : l)));
        setFrozenLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, title } : l)));
        return;
      }
      if (!user) return;
      await updateLinkTitle(user.uid, linkId, title);
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
    async (linkId: string) => {
      if (demoMode) {
        const moved = activeLinks.find((l) => l.id === linkId);
        if (!moved) return;
        const now = Date.now();
        setActiveLinks((p) => p.filter((l) => l.id !== linkId));
        setFrozenLinks((fp) => [{ ...moved, state: "frozen", frozenAt: now, trashedAt: null }, ...fp]);
        return;
      }
      if (!user) return;
      await freezeLink(user.uid, linkId);
    },
    [demoMode, user, activeLinks]
  );

  const handleUnfreeze = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        const moved = frozenLinks.find((l) => l.id === linkId);
        if (!moved) return;
        setFrozenLinks((p) => p.filter((l) => l.id !== linkId));
        setActiveLinks((ap) => [{ ...moved, state: "active", frozenAt: null, trashedAt: null }, ...ap]);
        return;
      }
      if (!user) return;
      await unfreezeLink(user.uid, linkId);
    },
    [demoMode, user, frozenLinks]
  );

  const handleTrash = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        const now = Date.now();
        const moved =
          activeLinks.find((l) => l.id === linkId) ?? frozenLinks.find((l) => l.id === linkId);
        if (!moved) return;
        setActiveLinks((p) => p.filter((l) => l.id !== linkId));
        setFrozenLinks((p) => p.filter((l) => l.id !== linkId));
        setTrashedLinks((tp) => [
          { ...moved, state: "trashed", trashedAt: now, frozenAt: null },
          ...tp,
        ]);
        return;
      }
      if (!user) return;
      await softTrashLink(user.uid, linkId);
    },
    [demoMode, user, activeLinks, frozenLinks]
  );

  const handleRestore = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        const t = trashedLinks.find((l) => l.id === linkId);
        if (!t) return;
        setTrashedLinks((prev) => prev.filter((l) => l.id !== linkId));
        setActiveLinks((prev) => [{ ...t, state: "active", trashedAt: null, frozenAt: null }, ...prev]);
        return;
      }
      if (!user) return;
      await restoreLink(user.uid, linkId);
    },
    [demoMode, user, trashedLinks]
  );

  const handlePermanentDelete = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        setTrashedLinks((prev) => prev.filter((l) => l.id !== linkId));
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
        setPasteError("Clipboard unavailable — allow permission or use the field below.");
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

      if (target === "freezer") {
        if (from === "fridge") void handleFreeze(linkId);
        return;
      }
      if (target === "trash") {
        if (from === "fridge" || from === "freezer") void handleTrash(linkId);
        return;
      }
      if (from === "freezer") void handleUnfreeze(linkId);
      else if (from === "trash") void handleRestore(linkId);
    },
    [handleFreeze, handleTrash, handleUnfreeze, handleRestore]
  );

  const exitDemo = useCallback(() => {
    signOutDemo();
    setDemoMode(false);
    setDemoHydrated(false);
    router.replace("/login");
    router.refresh();
  }, [router]);

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
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        inbox={inbox}
        onClearInbox={onClearInbox}
        demoExit={demoMode ? exitDemo : undefined}
        searchQuery={linkSearch}
        onSearchChange={setLinkSearch}
        onOpenAddLink={() => setAddLinkOpen(true)}
      />
      {demoMode && (
        <div className="border-b border-black/5 bg-moo-accent/10">
          <p className="mx-auto max-w-6xl px-4 py-2.5 text-xs leading-snug text-moo-brown md:px-6">
            <span className="font-medium text-moo-dark">Demo mode</span> — links stay in this browser only
            (localStorage). Sign in with Google for cloud sync. Use the door icon in the header to exit demo.
          </p>
        </div>
      )}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0 p-4 md:p-6">
        <FridgeShelves
          tab={tab}
          onTab={setTab}
          frozenCount={frozenLinks.length}
          trashCount={recoverableTrash.length}
          dragOver={dragOver}
          onDragOverShelf={onDragOverShelf}
          onDropShelf={onDropShelf}
          onQuickPaste={onQuickPaste}
          pasteBusy={pasteBusy}
          pasteError={pasteError}
          dueReminderLine={
            dueCount > 0 ? (
              <p className="text-sm text-moo-brown">
                {dueCount} reminder{dueCount === 1 ? "" : "s"} due in the fridge — check the bell
              </p>
            ) : undefined
          }
        />

        <div
          className={`flex-1 flex flex-col min-h-0 rounded-2xl transition ${
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
          {!linkSearch.trim() && gridLinks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-moo-brown text-center p-8 rounded-2xl border border-dashed border-black/10 bg-white/50">
              {tab === "fridge" ? (
                <p>
                  Fridge is empty. Tap <strong className="text-moo-dark">Paste</strong> next to Trash above, or use + in the header.
                </p>
              ) : tab === "freezer" ? (
                <p>Freezer is empty. Drag from the fridge onto Freezer, or Edit → Move to freezer.</p>
              ) : (
                <p>Trash is empty. Drag a card onto Trash, or move a link to trash from the fridge.</p>
              )}
            </div>
          ) : linkSearch.trim() && displayRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white/50 p-8 text-center text-moo-brown">
              <p className="text-sm font-medium text-moo-dark">{`Nothing dug up for “${linkSearch.trim()}”`}</p>
              <p className="text-xs">Fridge, freezer, and trash came up empty. Try another clue or clear the dig.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto pb-8">
              {linkSearch.trim() ? (
                <p className="mb-3 text-xs text-moo-brown/90">
                  Digging through <strong className="text-moo-dark">fridge</strong>, <strong className="text-moo-dark">freezer</strong>, and{" "}
                  <strong className="text-moo-dark">trash</strong>.
                </p>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {displayRows.map(({ link, shelf }) => (
                  <div key={link.id} className="min-w-0 space-y-2">
                    {linkSearch.trim() ? (
                      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-moo-brown">
                        {shelf === "fridge" ? "Fridge" : shelf === "freezer" ? "Freezer" : "Trash"}
                      </p>
                    ) : null}
                    <FridgeLinkCard
                      link={link}
                      dragSource={shelf}
                      onEdit={shelf === "fridge" || shelf === "freezer" ? setEditingLink : undefined}
                      onTogglePin={
                        shelf === "fridge" || shelf === "freezer"
                          ? (l) => void handleTogglePin(l.id)
                          : undefined
                      }
                    />
                    {shelf === "trash" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleRestore(link.id)}
                          className="flex-1 rounded-lg border border-black/8 bg-white px-1.5 py-2 text-center text-xs font-medium text-moo-dark transition hover:bg-black/[0.03]"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => void handlePermanentDelete(link.id)}
                          className="flex-1 rounded-lg border border-red-200/90 bg-red-50/80 px-1.5 py-2 text-center text-xs font-medium text-red-700 transition hover:bg-red-100/90"
                          title="Permanently delete this link"
                        >
                          Delete forever
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <AddLinkModal open={addLinkOpen} onClose={() => setAddLinkOpen(false)} onAdd={handleAdd} />

      {editingLink && (
        <EditLinkModal
          link={fridgeLinkToUiLink(editingLink)}
          onSave={handleSaveTitle}
          onRemove={handleTrash}
          onClose={() => setEditingLink(null)}
          onFreeze={
            editingLink.state === "active"
              ? async () => {
                  await handleFreeze(editingLink.id);
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
        />
      )}
    </div>
  );
}
