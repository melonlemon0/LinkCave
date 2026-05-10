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
import { IconChevronLeft, IconLogOut } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import type { UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS } from "@/types/linkfridge";

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
  const [dayA, setDayA] = useState(String(DEFAULT_REMINDER_OFFSETS[0]));
  const [dayB, setDayB] = useState(String(DEFAULT_REMINDER_OFFSETS[1]));
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
      setDayA(String(p.settings.reminderDayOffsets[0]));
      setDayB(String(p.settings.reminderDayOffsets[1]));
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
      setDayA(String(s.reminderDayOffsets[0]));
      setDayB(String(s.reminderDayOffsets[1]));
    });
    return () => unsub();
  }, [demoMode, authLoading, configured, user, router]);

  async function saveSettings() {
    const a = Number.parseInt(dayA, 10);
    const b = Number.parseInt(dayB, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
      setError("Reminder days must be non-negative numbers.");
      return;
    }
    setError(null);
    setSaving(true);
    const nextSettings: UserSettings = {
      reminderDayOffsets: [Math.min(a, b), Math.max(a, b)],
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
      setError(e instanceof Error ? e.message : "Failed to save");
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
        <AppLoadingScreen message="Loading settings…" />
      </main>
    );
  }

  if (!demoMode && (!configured || !user)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-moo-dark shadow-apple transition hover:bg-moo-cream/80"
          >
            <IconChevronLeft className="h-4 w-4 text-moo-accent" />
            Back to fridge
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-moo-dark mb-2">Settings</h1>
        <p className="text-moo-brown text-sm mb-8">
          {demoMode ? (
            <>
              <strong className="text-moo-dark">Demo mode</strong> — reminders and preferences are saved in
              localStorage on this device.
            </>
          ) : (
            <>
              Signed in as <span className="font-medium text-moo-dark">{user?.email}</span>
            </>
          )}
        </p>

        <section className="bg-white rounded-2xl border border-black/8 shadow-apple p-5 mb-6">
          <h2 className="font-semibold text-moo-dark mb-3">Reminders</h2>
          <p className="text-sm text-moo-brown mb-4">
            After you save a link, LinkFridge nudges you on these day counts (from the save date),
            so nothing sits forgotten.
          </p>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <label className="block text-xs text-moo-brown mb-1">First reminder (days)</label>
              <input
                type="number"
                min={0}
                value={dayA}
                onChange={(e) => setDayA(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl border border-black/8"
              />
            </div>
            <div>
              <label className="block text-xs text-moo-brown mb-1">Second reminder (days)</label>
              <input
                type="number"
                min={0}
                value={dayB}
                onChange={(e) => setDayB(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl border border-black/8"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSettings()}
            className="px-4 py-2 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save reminder schedule"}
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-black/8 shadow-apple p-5 mb-6">
          <h2 className="font-semibold text-moo-dark mb-3">Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={() => void toggleNotifications()}
              className="rounded border-black/20"
            />
            <span className="text-sm text-moo-dark">Enable reminder notifications</span>
          </label>
          {notifPermission !== "unsupported" && (
            <div className="space-y-2">
              <p className="text-xs text-moo-brown">
                Browser status: <span className="font-medium">{notifPermission}</span>
              </p>
              {notifPermission !== "granted" && (
                <button
                  type="button"
                  onClick={() => void requestBrowserNotifications()}
                  className="text-sm px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5"
                >
                  Allow browser notifications
                </button>
              )}
            </div>
          )}
          {notifPermission === "unsupported" && (
            <p className="text-xs text-moo-brown">This browser does not support notifications.</p>
          )}
        </section>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/90 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-700 shadow-apple transition hover:bg-red-50 sm:w-auto"
        >
          <IconLogOut className="h-[18px] w-[18px] shrink-0" />
          {demoMode ? "Exit demo" : "Sign out"}
        </button>
      </div>
    </main>
  );
}
