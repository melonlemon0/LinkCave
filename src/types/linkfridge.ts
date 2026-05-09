/** Saved link in Firestore (`users/{uid}/links/{id}`). */
export type FridgeLink = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string | null;
  /** Epoch ms */
  createdAt: number;
  state: "active" | "trashed";
  /** Epoch ms when moved to trash; null if active */
  trashedAt: number | null;
  sortOrder: number;
  /** Day offsets (e.g. 3, 5) for which we already showed / recorded a reminder */
  reminderFiredOffsets: number[];
};

export type UserSettings = {
  reminderDayOffsets: [number, number];
  notificationsEnabled: boolean;
};

export const DEFAULT_REMINDER_OFFSETS: [number, number] = [3, 5];

export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
