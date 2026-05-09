import type { FridgeLink, UserSettings } from "@/types/linkfridge";

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Whole calendar days since `createdAt` (local midnight boundaries). */
export function wholeDaysSinceSaved(createdAtMs: number): number {
  const diff = startOfDayMs(new Date()) - startOfDayMs(new Date(createdAtMs));
  return Math.floor(diff / 86400000);
}

/** Offsets (e.g. 3, 5) that are due but not yet recorded on the link. */
export function getPendingReminderOffsets(
  link: FridgeLink,
  settings: UserSettings
): number[] {
  if (link.state !== "active") return [];
  const days = wholeDaysSinceSaved(link.createdAt);
  const fired = new Set(link.reminderFiredOffsets ?? []);
  const pending: number[] = [];
  const offsets = Array.from(new Set(settings.reminderDayOffsets));
  for (const offset of offsets) {
    if (days >= offset && !fired.has(offset)) pending.push(offset);
  }
  return pending;
}

export function countDueReminders(links: FridgeLink[], settings: UserSettings): number {
  let n = 0;
  for (const link of links) {
    n += getPendingReminderOffsets(link, settings).length;
  }
  return n;
}
