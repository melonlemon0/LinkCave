"use client";

import { useState } from "react";
import type { Folder, Link } from "@/types/db";

/** Take a single URL from input (first line; if pasted twice without newline, take first URL only). */
function getSingleUrl(input: string): string {
  const firstLine = input.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "";
  try {
    new URL(firstLine);
    return firstLine;
  } catch {
    // Duplicated URL pasted without newline: find first URL and stop before the second
    const protocol = firstLine.startsWith("https://") ? "https://" : firstLine.startsWith("http://") ? "http://" : null;
    if (protocol) {
      const rest = firstLine.slice(protocol.length);
      const nextStart = rest.indexOf("https://");
      const nextStartHttp = rest.indexOf("http://");
      const next = nextStart === -1 ? nextStartHttp : nextStartHttp === -1 ? nextStart : Math.min(nextStart, nextStartHttp);
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

type Props = {
  currentFolderId: string | null;
  onLinkAdded: (link: Link) => void;
  folders: Folder[];
};

export function AddLinkForm({ currentFolderId, onLinkAdded, folders }: Props) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = getSingleUrl(url);
    if (!raw || !currentFolderId) return;
    setError(null);
    setSaving(true);
    try {
      let title = new URL(raw).hostname;
      let thumbnail_url: string | null = null;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(raw)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (metaRes.ok) {
          const data = await metaRes.json();
          title = data.title ?? title;
          thumbnail_url = data.thumbnail_url ?? null;
        }
      } catch {
        // Use hostname and no thumbnail if metadata fails or times out
      }
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: currentFolderId,
          url: raw,
          title,
          thumbnail_url,
        }),
      });
      const link = await res.json();
      if (!res.ok) throw new Error(link.error ?? "Failed to save link");
      onLinkAdded(link as Link);
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
        placeholder="Paste link and save"
        className="flex-1 min-w-[180px] px-4 py-3 rounded-xl bg-white text-moo-dark placeholder:text-moo-brown/60 border border-black/8 shadow-apple focus:outline-none focus:ring-2 focus:ring-moo-accent/50 focus:border-transparent"
        disabled={saving}
      />
      <button
        type="submit"
        disabled={saving || !url.trim() || !currentFolderId}
        className="px-5 py-3 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50 hover:enabled:bg-[#0077ed] transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
