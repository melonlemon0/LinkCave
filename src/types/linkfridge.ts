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
  sortOrder: number;
  /** Pinned links sort to the top of the fridge or freezer grid. */
  pinned: boolean;
  /** Day offsets (e.g. 3, 5) for which we already showed / recorded a reminder */
  reminderFiredOffsets: number[];
};

export type UserSettings = {
  reminderDayOffsets: [number, number];
  notificationsEnabled: boolean;
};

export const DEFAULT_REMINDER_OFFSETS: [number, number] = [3, 5];

export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Main UI shelf: fridge grid, freezer, or trash. */
export type ShelfTab = "fridge" | "freezer" | "trash";
