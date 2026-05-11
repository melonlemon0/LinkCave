import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { DEFAULT_REMINDER_OFFSETS, type UserSettings } from "@/types/linkfridge";
import { getFirestoreDb } from "./config";

const userDoc = (uid: string) => doc(getFirestoreDb(), "users", uid);

export async function ensureUserProfile(uid: string, email: string | null): Promise<void> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    email: email ?? null,
    reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
  });
}

export function parseUserSettings(data: Record<string, unknown> | undefined): UserSettings {
  const raw = data?.reminderDayOffsets;
  let reminderDayOffsets: [number, number] = [...DEFAULT_REMINDER_OFFSETS];
  if (Array.isArray(raw) && raw.length >= 1) {
    const a = Number(raw[0]);
    const b = raw.length >= 2 ? Number(raw[1]) : a;
    if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= 0) {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      reminderDayOffsets = [lo, hi] as [number, number];
    }
  }
  const notificationsEnabled =
    typeof data?.notificationsEnabled === "boolean" ? data.notificationsEnabled : true;
  return { reminderDayOffsets, notificationsEnabled };
}

export function subscribeUserSettings(
  uid: string,
  onSettings: (s: UserSettings) => void
): Unsubscribe {
  return onSnapshot(userDoc(uid), (snap) => {
    onSettings(parseUserSettings(snap.data() as Record<string, unknown> | undefined));
  });
}

export async function updateUserSettings(uid: string, next: UserSettings): Promise<void> {
  await updateDoc(userDoc(uid), {
    reminderDayOffsets: [...next.reminderDayOffsets],
    notificationsEnabled: next.notificationsEnabled,
    updatedAt: serverTimestamp(),
  });
}
