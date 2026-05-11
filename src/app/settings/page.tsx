"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import {
  ensureUserProfile,
  parseUserSettings,
  subscribeUserSettings,
  updateUserSettings,
} from "@/lib/firebase/profile";
import { doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/config";
import { isDemoSignedIn, loadDemoPayload, saveDemoPayload, signOutDemo } from "@/lib/local/demo-store";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { IconChevronLeft, IconFridge, IconLogOut, IconSnowflake } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import type { UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS } from "@/types/linkfridge";

function singleReminderDay(offsets: [number, number]): number {
  return Math.min(offsets[0], offsets[1]);
}

export default function SettingsPage() {
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(false);

  useLayoutEffect(() => {
    setDemoMode(isDemoSignedIn());
  }, []);
  const [settings, setSettings] = useState<UserSettings>({
    reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
    notificationsEnabled: true,
  });
  const [day, setDay] = useState(String(singleReminderDay(DEFAULT_REMINDER_OFFSETS)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  useEffect(() => {
    if (!demoMode && typeof window !== "undefined" && isDemoSignedIn()) return;

    if (demoMode) {
      const p = loadDemoPayload();
      setSettings(p.settings);
      setDay(String(singleReminderDay(p.settings.reminderDayOffsets)));
      return;
    }
    if (authLoading) return;
    if (!configured || !user) {
      router.replace("/login");
      return;
    }
    void ensureUserProfile(user.uid, user.email);
    const unsub = subscribeUserSettings(user.uid, (s) => {
      setSettings(s);
      setDay(String(singleReminderDay(s.reminderDayOffsets)));
    });
    return () => unsub();
  }, [demoMode, authLoading, configured, user, router]);

  async function saveSettings() {
    const n = Number.parseInt(day, 10);
    if (!Number.isFinite(n) || n < 0) {
      setError("Invalid");
      return;
    }
    setError(null);
    setSaving(true);
    const nextSettings: UserSettings = {
      reminderDayOffsets: [n, n],
      notificationsEnabled: settings.notificationsEnabled,
    };
    try {
      if (demoMode) {
        const p = loadDemoPayload();
        saveDemoPayload({ ...p, settings: nextSettings });
        setSettings(nextSettings);
      } else {
        if (!user) return;
        const ref = doc(getFirestoreDb(), "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await ensureUserProfile(user.uid, user.email);
        }
        await updateUserSettings(user.uid, nextSettings);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifications() {
    const next = !settings.notificationsEnabled;
    setSettings((prev) => ({ ...prev, notificationsEnabled: next }));
    try {
      if (demoMode) {
        const p = loadDemoPayload();
        saveDemoPayload({
          ...p,
          settings: { ...p.settings, notificationsEnabled: next },
        });
      } else {
        if (!user) return;
        const ref = doc(getFirestoreDb(), "users", user.uid);
        const snap = await getDoc(ref);
        const parsed = parseUserSettings(snap.data() as Record<string, unknown> | undefined);
        await updateUserSettings(user.uid, {
          ...parsed,
          notificationsEnabled: next,
        });
      }
    } catch {
      setSettings((prev) => ({ ...prev, notificationsEnabled: !next }));
    }
  }

  async function requestBrowserNotifications() {
    if (typeof Notification === "undefined") return;
    try {
      const p = await Notification.requestPermission();
      setNotifPermission(p);
    } catch {
      setNotifPermission("denied");
    }
  }

  function handleSignOut() {
    if (demoMode) {
      signOutDemo();
      router.replace("/login");
      router.refresh();
      return;
    }
    void signOut().then(() => router.replace("/login"));
  }

  if (authLoading && !demoMode) {
    return (
      <main className="min-h-screen">
        <AppLoadingScreen message="…" />
      </main>
    );
  }

  if (!demoMode && (!configured || !user)) {
    return null;
  }

  const inputClass =
    "w-full max-w-[5.5rem] rounded-2xl border border-black/5 bg-white/90 px-2 py-2.5 text-center text-sm font-semibold tabular-nums text-moo-dark shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-moo-accent/30";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-white">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-2 pb-10 pt-2 sm:px-3 md:px-4 md:pb-12 md:pt-3">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-1.5">
            <Link
              href="/"
              className="-ml-1 inline-flex items-center justify-center rounded-xl p-2 text-moo-accent hover:bg-black/[0.04] hover:opacity-90"
              aria-label="Back to fridge"
            >
              <IconChevronLeft className="h-7 w-7 shrink-0" aria-hidden />
            </Link>
          </div>
          <section className="overflow-hidden rounded-2xl border border-emerald-200/45 bg-gradient-to-b from-sky-100/95 via-cyan-50/90 to-emerald-100/95 p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-3 text-moo-dark">
              <IconSnowflake className="h-4 w-4 shrink-0 text-sky-800/80" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-moo-dark/75">Reminder</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2.5">
              <span className="text-sm text-moo-dark">{settings.notificationsEnabled ? "On" : "Off"}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notificationsEnabled}
                aria-label="Toggle reminder notifications"
                onClick={() => void toggleNotifications()}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? "bg-moo-accent/90" : "bg-black/15"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {notifPermission !== "unsupported" ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] capitalize text-moo-brown">{notifPermission}</span>
                {notifPermission !== "granted" ? (
                  <button
                    type="button"
                    onClick={() => void requestBrowserNotifications()}
                    className="rounded-xl border border-black/[0.08] bg-white/90 px-2.5 py-1 text-[11px] font-medium text-moo-dark shadow-sm hover:bg-moo-cream/50"
                  >
                    Allow
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-moo-brown">—</p>
            )}

            <div className="my-4 border-t border-black/[0.06]" />

            <div className="flex items-center gap-2 text-moo-dark">
              <IconFridge className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-moo-dark/75">Day</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={0}
                aria-label="Reminder day offset"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={inputClass}
              />
            </div>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveSettings()}
              className="mt-4 w-full rounded-2xl bg-moo-dark py-2.5 text-xs font-semibold text-white shadow-apple hover:opacity-[0.92] disabled:opacity-40"
            >
              {saving ? "…" : "Save"}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white/75 py-2.5 text-xs font-medium text-moo-dark shadow-sm hover:bg-white"
            >
              <IconLogOut className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              {demoMode ? "Exit demo" : "Sign out"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
