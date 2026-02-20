"use client";

import { useState } from "react";
import { useDrop } from "react-dnd";
import type { Folder } from "@/types/db";
import { createClient } from "@/lib/supabase/client";
import { FolderEditModal } from "./FolderEditModal";

const LINK_TYPE = "link";

type Props = {
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveLink: (linkId: string, folderId: string) => void;
  onFoldersChange: (folders: Folder[]) => void;
  everythingId: string;
};

function FolderDropTarget({
  folder,
  isSelected,
  onSelect,
  onMoveLink,
  onEdit,
}: {
  folder: Folder;
  isSelected: boolean;
  onSelect: () => void;
  onMoveLink: (linkId: string) => void;
  onEdit: () => void;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: LINK_TYPE,
    drop: (item: { linkId: string }) => {
      onMoveLink(item.linkId);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-1.5 cursor-pointer transition flex-shrink-0"
    >
      <span
        className={`w-14 h-14 flex items-center justify-center rounded-[22%] shadow-ios-icon text-2xl transition relative
          ${isSelected ? "bg-moo-accent/15" : "bg-gray-100 group-hover:bg-gray-200/80"}
          ${isOver ? "!bg-moo-accent/20" : ""}
        `}
      >
        {folder.emoji}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 text-moo-brown/70 hover:text-moo-dark w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-apple text-[10px] border border-black/8"
          aria-label="Edit folder"
        >
          ✏️
        </button>
      </span>
      {folder.name ? (
        <span className="text-[11px] font-medium text-moo-dark text-center truncate w-full max-w-[72px] leading-tight">{folder.name}</span>
      ) : (
        <span className="text-[11px] leading-tight min-h-[11px] block" aria-hidden>&nbsp;</span>
      )}
    </div>
  );
}

export function FolderSidebar({
  folders,
  selectedId,
  onSelect,
  onMoveLink,
  onFoldersChange,
  everythingId,
}: Props) {
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [creating, setCreating] = useState(false);
  const supabase = createClient();

  const handleMove = (linkId: string, folderId: string) => {
    fetch("/api/links/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, folderId }),
    }).then(() => onMoveLink(linkId, folderId));
  };

  const saveFolder = async (name: string, emoji: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Not signed in.";
    if (editingFolder) {
      const { error } = await supabase
        .from("folders")
        .update({ name, emoji })
        .eq("id", editingFolder.id);
      if (error) return error.message;
      onFoldersChange(
        folders.map((f) => (f.id === editingFolder.id ? { ...f, name, emoji } : f))
      );
      setEditingFolder(null);
      return null;
    }
    if (creating) {
      if (folders.length >= 5) return "Maximum 5 folders allowed.";
      const maxOrder = folders.length ? Math.max(...folders.map((f) => f.sort_order)) : 0;
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji, sort_order: maxOrder + 1 }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Failed to create folder";
      if (data) {
        onFoldersChange([...folders, data as Folder]);
        setCreating(false);
      }
      return null;
    }
    return null;
  };

  const deleteFolder = async () => {
    if (!editingFolder) return;
    await supabase.from("folders").delete().eq("id", editingFolder.id);
    onFoldersChange(folders.filter((f) => f.id !== editingFolder.id));
    if (selectedId === editingFolder.id) onSelect(folders.find((f) => f.id !== editingFolder.id)?.id ?? everythingId);
    setEditingFolder(null);
  };

  return (
    <>
      <aside className="w-[88px] md:w-[96px] flex-shrink-0 bg-white/90 backdrop-blur-xl p-3 rounded-2xl md:ml-4 md:my-4 md:min-h-0 shadow-apple border border-black/5 flex flex-col overflow-hidden items-center">
        {folders.length < 5 && (
          <div className="flex justify-center py-1 mb-2">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-moo-accent hover:text-moo-brown text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition"
              title="New folder"
            >
              +
            </button>
          </div>
        )}
        <div className="flex flex-col gap-4 flex-1 min-h-0 justify-start items-center w-full">
          <button
            type="button"
            onClick={() => onSelect(everythingId)}
            className={`flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer transition
              ${selectedId === everythingId ? "opacity-100" : "opacity-90 hover:opacity-100"}
            `}
          >
            <span
              className={`w-14 h-14 flex items-center justify-center rounded-[22%] shadow-ios-icon text-2xl transition
                ${selectedId === everythingId ? "bg-moo-accent/15" : "bg-gray-100 hover:bg-gray-200/80"}
              `}
            >
              📂
            </span>
            <span className="text-[11px] font-medium text-moo-dark text-center truncate w-full max-w-[72px] leading-tight">ALL</span>
          </button>
          {folders.map((folder) => (
            <FolderDropTarget
              key={folder.id}
              folder={folder}
              isSelected={selectedId === folder.id}
              onSelect={() => onSelect(folder.id)}
              onMoveLink={(linkId) => handleMove(linkId, folder.id)}
              onEdit={() => setEditingFolder(folder)}
            />
          ))}
        </div>
      </aside>

      {(editingFolder || creating) && (
        <FolderEditModal
          folder={editingFolder ?? undefined}
          onSave={saveFolder}
          onClose={() => {
            setEditingFolder(null);
            setCreating(false);
          }}
          onDelete={editingFolder ? deleteFolder : undefined}
        />
      )}
    </>
  );
}
