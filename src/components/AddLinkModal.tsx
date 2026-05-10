"use client";

import { fetchLinkPreview } from "@/lib/linkfridge/fetch-link-preview";
import { getSingleUrl } from "@/lib/linkfridge/url-helpers";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { url: string; title: string; thumbnailUrl: string | null }) => Promise<void>;
};

export function AddLinkModal({ open, onClose, onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preview" | "persist">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setError(null);
      setPhase("idle");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = getSingleUrl(url);
    if (!raw) return;
    setError(null);
    setSaving(true);
    setPhase("preview");
    try {
      const preview = await fetchLinkPreview(raw);
      setPhase("persist");
      await onAdd(preview);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
      setPhase("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-apple-lg p-6 w-full max-w-md border border-black/8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-moo-dark mb-1">Add link</h3>
        <p className="text-sm text-moo-brown mb-4">
          Paste a URL — on slow sites we may wait well over a minute, retrying, so the title and thumbnail save correctly.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData?.getData("text")?.trim();
              if (text) setUrl(getSingleUrl(text));
            }}
            placeholder="https://…"
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-white text-moo-dark placeholder:text-moo-brown/50 border border-black/8 focus:outline-none focus:ring-2 focus:ring-moo-accent/40 mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-2.5 px-4 rounded-xl text-moo-brown hover:bg-moo-cream/80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !url.trim()}
              className="py-2.5 px-5 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50 hover:enabled:bg-[#0077ed]"
            >
              {saving
                ? phase === "preview"
                  ? "Fetching title & thumbnail…"
                  : "Saving…"
                : "Save to fridge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
