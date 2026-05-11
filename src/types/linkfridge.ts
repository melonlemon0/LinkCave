/** Cold storage shelf below the main fridge (all use `state: "frozen"`). */
export type FrozenZone = "freezer" | "meat" | "fruit";

/** Saved link in Firestore (`users/{uid}/links/{id}`). */
export type FridgeLink = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string | null;
  /** Epoch ms */
  createdAt: number;
  /** Fridge = active reminders; Freezer = paused; Trash = soft-deleted */
  state: "active" | "frozen" | "trashed";
  /** Epoch ms when moved to trash; null unless trashed */
  trashedAt: number | null;
  /** Epoch ms when moved to freezer; null unless frozen */
  frozenAt: number | null;
  /** Which cold shelf when `state === "frozen"`; null otherwise */
  frozenZone: FrozenZone | null;
  sortOrder: number;
  /** Pinned links sort to the top of the fridge or freezer grid. */
  pinned: boolean;
  /** Day offsets (e.g. 3, 5) for which we already showed / recorded a reminder */
  reminderFiredOffsets: number[];
};

/** Resolve cold shelf; missing legacy field → main freezer. */
export function linkFrozenZone(link: FridgeLink): FrozenZone {
  if (link.state !== "frozen") return "freezer";
  const z = link.frozenZone;
  return z === "meat" || z === "fruit" || z === "freezer" ? z : "freezer";
}

export type UserSettings = {
  /** Two slots stored for compatibility; app uses one nudge day as `[n, n]`. */
  reminderDayOffsets: [number, number];
  notificationsEnabled: boolean;
};

export const DEFAULT_REMINDER_OFFSETS: [number, number] = [3, 3];

export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Main UI shelf: fridge grid or one of the cold storage columns. */
export type ShelfTab = "fridge" | FrozenZone;
