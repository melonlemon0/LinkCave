"use client";

import { useState, useEffect } from "react";
import type { Link } from "@/types/db";

type Props = {
  link: Link;
  onSave: (linkId: string, title: string) => Promise<void>;
  onRemove: (linkId: string) => Promise<void>;
  onClose: () => void;
};

export function EditLinkModal({ link, onSave, onRemove, onClose }: Props) {
  const [title, setTitle] = useState(link.title);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(link.title);
  }, [link]);

  async function handleSave() {
    const t = title.trim();
    if (!t) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      await onSave(link.id, t);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this link?")) return;
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove");
      }
      await onRemove(link.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-apple-lg p-6 w-full max-w-sm border border-black/8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-moo-dark mb-4">Edit link</h3>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm text-moo-brown/80 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white text-moo-dark border border-black/8 focus:outline-none focus:ring-2 focus:ring-moo-accent/50 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRemove}
            disabled={saving || removing}
            className="py-2 px-4 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove link"}
          </button>
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-xl text-moo-brown hover:bg-moo-brown/10">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || removing}
            className="py-2 px-4 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
