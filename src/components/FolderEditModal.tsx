"use client";

import { useState, useEffect } from "react";
import type { Folder } from "@/types/db";

type Props = {
  folder?: Folder;
  onSave: (name: string, emoji: string) => Promise<string | null>;
  onClose: () => void;
  onDelete?: () => void;
};

const EMOJI_OPTIONS = [
  "🔗", "📌", "📁", "📂", "🔖", "📎", "📋", "📄", "📰", "📖",
  "📺", "🎬", "🎵", "🎧", "🎮", "📱", "💻", "🛒", "✈️", "🗺️",
  "🍳", "☕", "🏃", "🧘", "💡", "🎓", "💼", "🏠", "❤️", "⭐",
  "🐶", "🌸", "🎨", "✍️", "📷", "🎯", "🧩", "🔧", "💬", "📞",
];

export function FolderEditModal({ folder, onSave, onClose, onDelete }: Props) {
  const [name, setName] = useState(folder?.name ?? "");
  const [emoji, setEmoji] = useState(folder?.emoji ?? "📁");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setEmoji(folder.emoji);
    } else {
      setName("");
      setEmoji("📁");
    }
  }, [folder]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-apple-lg p-6 w-full max-w-sm border border-black/8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-moo-dark mb-4">{folder ? "Edit folder" : "New folder"}</h3>
        <div className="mb-4">
          <label className="block text-sm text-moo-brown/80 mb-1">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl ${emoji === e ? "bg-moo-accent/20 text-moo-accent" : "bg-black/5 hover:bg-black/10"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm text-moo-brown/80 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional — emoji is enough"
            className="w-full px-4 py-2.5 rounded-xl bg-white text-moo-dark border border-black/8 focus:outline-none focus:ring-2 focus:ring-moo-accent/50 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete()}
              className="py-2 px-4 rounded-xl text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-xl text-moo-brown hover:bg-moo-brown/10" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            className="py-2 px-4 rounded-xl bg-moo-accent text-white font-medium disabled:opacity-50"
            onClick={async () => {
              setError(null);
              setSaving(true);
              try {
                const err = await onSave(name.trim(), emoji);
                if (err) setError(err);
                else onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
