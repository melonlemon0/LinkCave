"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { ensureUserProfile, subscribeUserSettings } from "@/lib/firebase/profile";
import {
  addUserLink,
  purgeExpiredTrash,
  recordReminderFired,
  restoreLink,
  softTrashLink,
  subscribeActiveLinks,
  subscribeTrashedLinks,
  updateLinkTitle,
} from "@/lib/firebase/links-repo";
import {
  isDemoSignedIn,
  loadDemoPayload,
  newDemoLink,
  saveDemoPayload,
  signOutDemo,
} from "@/lib/local/demo-store";
import { countDueReminders, getPendingReminderOffsets } from "@/lib/linkfridge/reminders";
import { fridgeLinkToUiLink } from "@/lib/linkfridge/to-ui-link";
import { TRASH_RETENTION_MS, type FridgeLink, type UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS } from "@/types/linkfridge";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header, type ReminderInboxItem } from "./Header";
import { AddLinkForm } from "./AddLinkForm";
import { FridgeLinkCard } from "./FridgeLinkCard";
import { EditLinkModal } from "./EditLinkModal";

type Tab = "fridge" | "trash";

export function AppShell() {
  const { user, loading: authLoading, configured } = useAuth();
  const router = useRouter();
  /** Sync with localStorage on first client paint so we never flash "no user" and redirect to /login. */
  const [demoMode, setDemoMode] = useState(
    () => typeof window !== "undefined" && isDemoSignedIn()
  );
  const [demoHydrated, setDemoHydrated] = useState(false);

  const [tab, setTab] = useState<Tab>("fridge");
  const [activeLinks, setActiveLinks] = useState<FridgeLink[]>([]);
  const [trashedLinks, setTrashedLinks] = useState<FridgeLink[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
    notificationsEnabled: true,
  });
  const [editingLink, setEditingLink] = useState<FridgeLink | null>(null);
  const [inbox, setInbox] = useState<ReminderInboxItem[]>([]);
  const reminderDedupe = useRef(new Set<string>());

  useEffect(() => {
    if (!demoMode) return;
    const p = loadDemoPayload();
    const active = p.links.filter((l) => l.state === "active").sort((a, b) => b.createdAt - a.createdAt);
    const trashed = p.links.filter((l) => l.state === "trashed").sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
    setActiveLinks(active);
    setTrashedLinks(trashed);
    setSettings(p.settings);
    setDemoHydrated(true);
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode || !demoHydrated) return;
    saveDemoPayload({ links: [...activeLinks, ...trashedLinks], settings });
  }, [demoMode, demoHydrated, activeLinks, trashedLinks, settings]);

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
    const unsubT = subscribeTrashedLinks(user.uid, setTrashedLinks);
    const unsubS = subscribeUserSettings(user.uid, setSettings);
    return () => {
      unsubA();
      unsubT();
      unsubS();
    };
  }, [demoMode, user]);

  const recoverableTrash = useMemo(() => {
    const now = Date.now();
    return trashedLinks.filter((l) => {
      if (l.trashedAt == null) return false;
      return now - l.trashedAt < TRASH_RETENTION_MS;
    });
  }, [trashedLinks]);

  const expiredTrashCount = trashedLinks.length - recoverableTrash.length;

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
        setActiveLinks((prev) => [newDemoLink(input), ...prev]);
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
        return;
      }
      if (!user) return;
      await updateLinkTitle(user.uid, linkId, title);
    },
    [demoMode, user]
  );

  const handleTrash = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        const now = Date.now();
        let moved: FridgeLink | undefined;
        setActiveLinks((prev) => {
          moved = prev.find((l) => l.id === linkId);
          return prev.filter((l) => l.id !== linkId);
        });
        if (moved) {
          const trashed: FridgeLink = { ...moved, state: "trashed", trashedAt: now };
          setTrashedLinks((tp) => [trashed, ...tp]);
        }
        return;
      }
      if (!user) return;
      await softTrashLink(user.uid, linkId);
    },
    [demoMode, user]
  );

  const handleRestore = useCallback(
    async (linkId: string) => {
      if (demoMode) {
        const t = trashedLinks.find((l) => l.id === linkId);
        if (!t) return;
        setTrashedLinks((prev) => prev.filter((l) => l.id !== linkId));
        setActiveLinks((prev) => [{ ...t, state: "active", trashedAt: null }, ...prev]);
        return;
      }
      if (!user) return;
      await restoreLink(user.uid, linkId);
    },
    [demoMode, user, trashedLinks]
  );

  const exitDemo = useCallback(() => {
    signOutDemo();
    setDemoMode(false);
    setDemoHydrated(false);
    router.replace("/login");
    router.refresh();
  }, [router]);

  if (demoMode) {
    if (!demoHydrated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-moo-cream text-moo-brown">
          Loading…
        </div>
      );
    }
  } else {
    if (authLoading || !configured) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-moo-cream text-moo-brown">
          Loading…
        </div>
      );
    }
    if (!user) {
      return null;
    }
  }

  const gridLinks = tab === "fridge" ? activeLinks : recoverableTrash;

  return (
    <div className="min-h-screen flex flex-col bg-moo-cream">
      <Header inbox={inbox} onClearInbox={onClearInbox} demoExit={demoMode ? exitDemo : undefined} />
      {demoMode && (
        <p className="text-center text-xs text-moo-brown px-4 py-2 bg-moo-accent/10 border-b border-black/5">
          Demo mode — links stay in this browser only (localStorage). Use Google sign-in for cloud sync.
        </p>
      )}
      <main className="flex-1 flex flex-col min-h-0 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("fridge")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === "fridge" ? "bg-moo-accent text-white" : "bg-white border border-black/8 text-moo-dark"
            }`}
          >
            Fridge {activeLinks.length > 0 && `(${activeLinks.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("trash")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === "trash" ? "bg-moo-accent text-white" : "bg-white border border-black/8 text-moo-dark"
            }`}
          >
            Trash {recoverableTrash.length > 0 && `(${recoverableTrash.length})`}
          </button>
          {dueCount > 0 && tab === "fridge" && (
            <span className="text-sm text-moo-brown ml-auto">
              {dueCount} reminder{dueCount === 1 ? "" : "s"} due — check the bell
            </span>
          )}
        </div>

        {tab === "fridge" && <AddLinkForm onAdd={handleAdd} />}

        {tab === "trash" && (
          <p className="text-sm text-moo-brown mb-4">
            Trashed links can be restored for 30 days, then they are removed permanently.
            {expiredTrashCount > 0 && (
              <span className="block mt-1 text-xs">
                {expiredTrashCount} older item{expiredTrashCount === 1 ? "" : "s"} already expired from this device
                view after cleanup.
              </span>
            )}
          </p>
        )}

        {gridLinks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-moo-brown text-center p-8 rounded-2xl border border-dashed border-black/10 bg-white/50">
            {tab === "fridge" ? (
              <p>Nothing in the fridge yet. Paste a link above.</p>
            ) : (
              <p>Trash is empty.</p>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {gridLinks.map((link) => (
                <div key={link.id} className="min-w-0 space-y-2">
                  <FridgeLinkCard
                    link={link}
                    onEdit={tab === "fridge" ? setEditingLink : undefined}
                  />
                  {tab === "trash" && (
                    <button
                      type="button"
                      onClick={() => void handleRestore(link.id)}
                      className="w-full text-xs py-2 rounded-lg bg-white border border-black/8 hover:bg-moo-cream text-moo-dark"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {editingLink && (
        <EditLinkModal
          link={fridgeLinkToUiLink(editingLink)}
          onSave={handleSaveTitle}
          onRemove={handleTrash}
          onClose={() => setEditingLink(null)}
        />
      )}
    </div>
  );
}
