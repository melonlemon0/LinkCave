"use client";

import { useState, useEffect } from "react";
import type { Link } from "@/types/db";

type Props = {
  link: Link;
  onSave: (linkId: string, title: string) => Promise<void>;
  onRemove: (linkId: string) => Promise<void>;
  onClose: () => void;
  /** Fridge: move to freezer (reminders pause). */
  onFreeze?: () => Promise<void>;
  /** Freezer: move back to fridge. */
  onThaw?: () => Promise<void>;
};

export function EditLinkModal({ link, onSave, onRemove, onClose, onFreeze, onThaw }: Props) {
  const [title, setTitle] = useState(link.title);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [zoneBusy, setZoneBusy] = useState(false);
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
      await onSave(link.id, t);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      await onRemove(link.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemoving(false);
    }
  }

  async function handleFreeze() {
    if (!onFreeze) return;
    setError(null);
    setZoneBusy(true);
    try {
      await onFreeze();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setZoneBusy(false);
    }
  }

  async function handleThaw() {
    if (!onThaw) return;
    setError(null);
    setZoneBusy(true);
    try {
      await onThaw();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setZoneBusy(false);
    }
  }

  const busy = saving || removing || zoneBusy;

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
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-xl bg-white text-moo-dark border border-black/8 focus:outline-none focus:ring-2 focus:ring-moo-accent/50 focus:border-transparent disabled:opacity-50"
          />
        </div>
        {onFreeze && (
          <button
            type="button"
            onClick={() => void handleFreeze()}
            disabled={busy}
            className="mb-3 w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-sky-200 bg-sky-50/80 text-sky-900 hover:bg-sky-100/90 disabled:opacity-50"
          >
            {zoneBusy ? "Moving…" : "Move to freezer"}
          </button>
        )}
        {onThaw && (
          <button
            type="button"
            onClick={() => void handleThaw()}
            disabled={busy}
            className="mb-3 w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-black/10 bg-moo-cream/80 text-moo-dark hover:bg-moo-cream disabled:opacity-50"
          >
            {zoneBusy ? "Moving…" : "Move to fridge"}
          </button>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="py-2 px-4 rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? "Moving…" : "Move to trash"}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="py-2 px-4 rounded-xl text-moo-brown hover:bg-moo-brown/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || busy}
            className="py-2 px-4 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
