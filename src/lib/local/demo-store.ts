"use client";

import type { FridgeLink, FrozenZone, UserSettings } from "@/types/linkfridge";
import { DEFAULT_REMINDER_OFFSETS, TRASH_RETENTION_MS } from "@/types/linkfridge";

const DEMO_AUTH_KEY = "linkfridge-demo-session";
const DEMO_DATA_KEY = "linkfridge-demo-data";

type DemoPayload = {
  links: FridgeLink[];
  settings: UserSettings;
};

function defaultPayload(): DemoPayload {
  return {
    links: [],
    settings: {
      reminderDayOffsets: [...DEFAULT_REMINDER_OFFSETS],
      notificationsEnabled: true,
    },
  };
}

function purgeExpired(links: FridgeLink[]): FridgeLink[] {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  return links.filter((l) => {
    if (l.state !== "trashed" || l.trashedAt == null) return true;
    return l.trashedAt >= cutoff;
  });
}

/** Coerce localStorage / legacy rows into `FridgeLink` so `thumbnailUrl` and numbers survive reload. */
function normalizeDemoLink(raw: unknown): FridgeLink | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const url = typeof o.url === "string" ? o.url : "";
  if (!id || !url) return null;

  const thumbRaw = o.thumbnailUrl ?? o.thumbnail_url;
  const thumbnailUrl =
    typeof thumbRaw === "string" && thumbRaw.trim() ? thumbRaw.trim() : null;

  let title = typeof o.title === "string" && o.title.trim() ? o.title.trim() : "";
  if (!title) {
    try {
      title = new URL(url).hostname;
    } catch {
      title = "Link";
    }
  }

  const createdRaw = o.createdAt ?? o.created_at;
  let createdAt = Date.now();
  if (typeof createdRaw === "number" && Number.isFinite(createdRaw)) {
    createdAt = createdRaw;
  } else if (typeof createdRaw === "string") {
    const t = Date.parse(createdRaw);
    if (!Number.isNaN(t)) createdAt = t;
  }

  const sortRaw = o.sortOrder ?? o.sort_order;
  const sortOrder =
    typeof sortRaw === "number" && Number.isFinite(sortRaw) ? sortRaw : createdAt;

  const pinRaw = o.pinned;
  const pinned = pinRaw === true || pinRaw === "true" || pinRaw === 1;

  const rawState = o.state;
  const state: FridgeLink["state"] =
    rawState === "trashed" ? "trashed" : rawState === "frozen" ? "frozen" : "active";

  const trashedRaw = o.trashedAt ?? o.trashed_at;
  let trashedAt: number | null = null;
  if (state === "trashed") {
    if (typeof trashedRaw === "number" && Number.isFinite(trashedRaw)) trashedAt = trashedRaw;
    else if (typeof trashedRaw === "string") {
      const t = Date.parse(trashedRaw);
      if (!Number.isNaN(t)) trashedAt = t;
    }
  }

  const frozenRaw = o.frozenAt ?? o.frozen_at;
  let frozenAt: number | null = null;
  let frozenZone: FrozenZone | null = null;
  if (state === "frozen") {
    if (typeof frozenRaw === "number" && Number.isFinite(frozenRaw)) frozenAt = frozenRaw;
    else if (typeof frozenRaw === "string") {
      const t = Date.parse(frozenRaw);
      if (!Number.isNaN(t)) frozenAt = t;
    }
    if (frozenAt == null) frozenAt = createdAt;
    const z = o.frozenZone;
    frozenZone = z === "meat" || z === "fruit" || z === "freezer" ? z : "freezer";
  } else {
    frozenAt = null;
  }

  const ro = o.reminderFiredOffsets ?? o.reminder_fired_offsets;
  const reminderFiredOffsets = Array.isArray(ro)
    ? ro.filter((n): n is number => typeof n === "number" && Number.isFinite(n))
    : [];

  return {
    id,
    url,
    title,
    thumbnailUrl,
    createdAt,
    state,
    trashedAt,
    frozenAt,
    frozenZone,
    sortOrder,
    pinned,
    reminderFiredOffsets,
  };
}

export function isDemoSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_AUTH_KEY) === "1";
}

export function signInDemo(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_AUTH_KEY, "1");
}

export function signOutDemo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_AUTH_KEY);
}

export function loadDemoPayload(): DemoPayload {
  if (typeof window === "undefined") return defaultPayload();
  const raw = localStorage.getItem(DEMO_DATA_KEY);
  if (!raw) return defaultPayload();
  try {
    const parsedUnknown = JSON.parse(raw) as unknown;
    if (!parsedUnknown || typeof parsedUnknown !== "object" || Array.isArray(parsedUnknown)) {
      return defaultPayload();
    }
    const parsed = parsedUnknown as DemoPayload;
    const rawLinks = Array.isArray(parsed.links) ? parsed.links : [];
    const links = purgeExpired(
      rawLinks.map(normalizeDemoLink).filter((l): l is FridgeLink => l != null)
    );
    const defaults = defaultPayload();
    const rawSettings = parsed.settings;
    const settings: UserSettings =
      rawSettings && typeof rawSettings === "object" && !Array.isArray(rawSettings)
        ? { ...defaults.settings, ...(rawSettings as UserSettings) }
        : defaults.settings;
    const ro = settings.reminderDayOffsets;
    if (!Array.isArray(ro) || ro.length < 1) {
      settings.reminderDayOffsets = [...DEFAULT_REMINDER_OFFSETS];
    } else {
      const a = Number(ro[0]);
      const b = ro.length >= 2 ? Number(ro[1]) : a;
      settings.reminderDayOffsets =
        Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= 0
          ? ([Math.min(a, b), Math.max(a, b)] as [number, number])
          : [...DEFAULT_REMINDER_OFFSETS];
    }
    if (typeof settings.notificationsEnabled !== "boolean") {
      settings.notificationsEnabled = true;
    }
    return { links, settings: { ...settings } };
  } catch {
    return defaultPayload();
  }
}

export function saveDemoPayload(payload: DemoPayload): void {
  if (typeof window === "undefined") return;
  const links = purgeExpired(payload.links);
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify({ ...payload, links }));
}

export function newDemoLink(input: {
  url: string;
  title: string;
  thumbnailUrl: string | null;
}): FridgeLink {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    url: input.url,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl,
    createdAt: Date.now(),
    state: "active",
    trashedAt: null,
    frozenAt: null,
    frozenZone: null,
    sortOrder: Date.now(),
    pinned: false,
    reminderFiredOffsets: [],
  };
}
