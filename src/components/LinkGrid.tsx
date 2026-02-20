"use client";

import { useState } from "react";
import type { Folder, Link } from "@/types/db";
import { LinkCard } from "./LinkCard";
import { ReorderDropSlot } from "./ReorderDropSlot";
import { EditLinkModal } from "./EditLinkModal";

type Props = {
  links: Link[];
  folderId: string | null;
  onMoveLink: (linkId: string, folderId: string) => void;
  onReorder?: (folderId: string, linkIds: string[]) => void;
  onLinkUpdated: (linkId: string, title: string) => void;
  onLinkRemoved: (linkId: string) => void;
  folders: Folder[];
};

export function LinkGrid({ links, folderId, onMoveLink, onReorder, onLinkUpdated, onLinkRemoved }: Props) {
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  function handleReorderByIndex(draggedLinkId: string, insertIndex: number) {
    if (!onReorder || links.length === 0) return;
    const draggedLink = links.find((l) => l.id === draggedLinkId);
    if (!draggedLink) return;

    if (folderId) {
      const ids = links.map((l) => l.id);
      const fromIdx = ids.indexOf(draggedLinkId);
      if (fromIdx === -1) return;
      const newIds = [...ids];
      newIds.splice(fromIdx, 1);
      const toIdx = fromIdx < insertIndex ? insertIndex - 1 : insertIndex;
      newIds.splice(toIdx, 0, draggedLinkId);
      fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId, link_ids: newIds }),
      }).then((res) => {
        if (res.ok) onReorder(folderId, newIds);
      });
      return;
    }

    const targetLink = insertIndex < links.length ? links[insertIndex] : links[links.length - 1];
    if (!targetLink) return;
    const targetFolderId = targetLink.folder_id;
    const inFolder = links
      .filter((l) => l.folder_id === targetFolderId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const insertPos = insertIndex < links.length
      ? inFolder.findIndex((l) => l.id === targetLink.id)
      : inFolder.length;
    const newIds = inFolder.map((l) => l.id).filter((id) => id !== draggedLinkId);
    newIds.splice(insertPos, 0, draggedLinkId);

    const moveThenReorder = () => {
      if (draggedLink.folder_id !== targetFolderId) {
        fetch("/api/links/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkId: draggedLinkId, folderId: targetFolderId }),
        }).then((res) => {
          if (res.ok) onMoveLink(draggedLinkId, targetFolderId);
          fetch("/api/links/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: targetFolderId, link_ids: newIds }),
          }).then((r) => {
            if (r.ok) onReorder(targetFolderId, newIds);
          });
        });
      } else {
        fetch("/api/links/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: targetFolderId, link_ids: newIds }),
        }).then((res) => {
          if (res.ok) onReorder(targetFolderId, newIds);
        });
      }
    };
    moveThenReorder();
  }

  if (links.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-moo-brown text-center p-8">
        <p>Save something</p>
      </div>
    );
  }

  const cells: React.ReactNode[] = [];
  links.forEach((link, i) => {
    cells.push(
      <ReorderDropSlot key={`slot-${i}`} insertIndex={i} onReorder={handleReorderByIndex} />
    );
    cells.push(
      <div key={link.id} className="min-w-0">
        <LinkCard link={link} onEdit={setEditingLink} />
      </div>
    );
  });
  cells.push(<ReorderDropSlot key={`slot-${links.length}`} insertIndex={links.length} onReorder={handleReorderByIndex} />);

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-[1rem_1fr] sm:grid-cols-[1rem_1fr_1rem_1fr] md:grid-cols-[1rem_1fr_1rem_1fr_1rem_1fr] lg:grid-cols-[1rem_1fr_1rem_1fr_1rem_1fr_1rem_1fr_1rem_1fr] gap-x-1 gap-y-3 sm:gap-3 pb-6">
          {cells}
        </div>
      </div>
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onSave={async (linkId, title) => {
            onLinkUpdated(linkId, title);
          }}
          onRemove={async (linkId) => {
            onLinkRemoved(linkId);
          }}
          onClose={() => setEditingLink(null)}
        />
      )}
    </>
  );
}
