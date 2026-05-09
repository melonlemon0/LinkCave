"use client";

import { useState } from "react";

/** Take a single URL from input (first line; if pasted twice without newline, take first URL only). */
function getSingleUrl(input: string): string {
  const firstLine = input.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "";
  try {
    new URL(firstLine);
    return firstLine;
  } catch {
    const protocol = firstLine.startsWith("https://")
      ? "https://"
      : firstLine.startsWith("http://")
        ? "http://"
        : null;
    if (protocol) {
      const rest = firstLine.slice(protocol.length);
      const nextStart = rest.indexOf("https://");
      const nextStartHttp = rest.indexOf("http://");
      const next =
        nextStart === -1 ? nextStartHttp : nextStartHttp === -1 ? nextStart : Math.min(nextStart, nextStartHttp);
      const single = next === -1 ? firstLine : protocol + rest.slice(0, next);
      try {
        new URL(single);
        return single;
      } catch {
        return firstLine;
      }
    }
  }
  return firstLine;
}

function normalizeLinkUrl(url: string): string {
  const firstLine = url.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return url;
  try {
    let single = firstLine;
    if (firstLine.includes("https://") || firstLine.includes("http://")) {
      const protocol = firstLine.startsWith("https://")
        ? "https://"
        : firstLine.startsWith("http://")
          ? "http://"
          : null;
      if (protocol) {
        const rest = firstLine.slice(protocol.length);
        const next = Math.min(
          rest.indexOf("https://") === -1 ? 1e9 : rest.indexOf("https://"),
          rest.indexOf("http://") === -1 ? 1e9 : rest.indexOf("http://")
        );
        single = next > 0 && next < 1e9 ? protocol + rest.slice(0, next) : firstLine;
      }
    }
    const u = new URL(single);
    if ((u.hostname === "youtu.be" || u.hostname.includes("youtube.com")) && u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.replace(/^\/shorts\//, "").split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    if (u.hostname === "youtu.be" && u.pathname.length > 1) {
      const id = u.pathname.slice(1).split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    return single;
  } catch {
    return firstLine;
  }
}

type Props = {
  onAdd: (input: { url: string; title: string; thumbnailUrl: string | null }) => Promise<void>;
};

export function AddLinkForm({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = getSingleUrl(url);
    if (!raw) return;
    setError(null);
    setSaving(true);
    try {
      let title = new URL(raw).hostname;
      let thumbnailUrl: string | null = null;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(raw)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (metaRes.ok) {
          const data = (await metaRes.json()) as { title?: string; thumbnail_url?: string | null };
          title = data.title ?? title;
          thumbnailUrl = data.thumbnail_url ?? null;
        }
      } catch {
        // hostname fallback
      }
      await onAdd({
        url: normalizeLinkUrl(raw),
        title,
        thumbnailUrl,
      });
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
      <input
        type="text"
        inputMode="url"
        autoComplete="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData?.getData("text")?.trim();
          if (text) setUrl(getSingleUrl(text));
        }}
        placeholder="Paste a link into the fridge"
        className="flex-1 min-w-[180px] px-4 py-3 rounded-xl bg-white text-moo-dark placeholder:text-moo-brown/60 border border-black/8 shadow-apple focus:outline-none focus:ring-2 focus:ring-moo-accent/50 focus:border-transparent"
        disabled={saving}
      />
      <button
        type="submit"
        disabled={saving || !url.trim()}
        className="px-5 py-3 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50 hover:enabled:bg-[#0077ed] transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
