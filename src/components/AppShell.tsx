"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Folder, Link as LinkType } from "@/types/db";
import { Header } from "./Header";
import { FolderSidebar } from "./FolderSidebar";
import { AddLinkForm } from "./AddLinkForm";
import { LinkGrid } from "./LinkGrid";

export const EVERYTHING_ID = "__everything__";

const PURGATORY_NAME = "Purgatory";
const PURGATORY_EMOJI = "⏳";

export function AppShell() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let purgatoryFolderId: string | null = null;

    async function load(): Promise<void> {
      const { data: foldersData } = await supabase
        .from("folders")
        .select("*")
        .order("sort_order", { ascending: true });

      let list = (foldersData ?? []) as Folder[];
      if (list.length === 0) {
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: PURGATORY_NAME, emoji: PURGATORY_EMOJI, sort_order: 0 }),
        });
        const inserted = await res.json();
        if (res.ok && inserted?.id) {
          list = [inserted as Folder];
          purgatoryFolderId = inserted.id;
        }
      } else {
        let purgatory = list.find((f) => f.name === PURGATORY_NAME);
        if (!purgatory) {
          const res = await fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: PURGATORY_NAME, emoji: PURGATORY_EMOJI, sort_order: -1 }),
          });
          const inserted = await res.json();
          if (res.ok && inserted?.id) {
            purgatory = inserted as Folder;
            list = [purgatory, ...list];
          }
        }
        purgatoryFolderId = purgatory?.id ?? list[0].id;
      }
      setFolders(list);
      setSelectedFolderId((prev) => prev ?? EVERYTHING_ID ?? null);

      const { data: linksData } = await supabase
        .from("links")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setLinks((linksData ?? []) as LinkType[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("links_folders")
      .on("postgres_changes", { event: "*", schema: "public", table: "links" }, () => {
        supabase.from("links").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }).then(({ data }) => setLinks((data ?? []) as LinkType[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "folders" }, () => {
        supabase.from("folders").select("*").order("sort_order", { ascending: true }).then(({ data }) => setFolders((data ?? []) as Folder[]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Keep a valid selection when we have folders
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) setSelectedFolderId(EVERYTHING_ID);
    if (folders.length > 0 && selectedFolderId && selectedFolderId !== EVERYTHING_ID && !folders.some((f) => f.id === selectedFolderId)) {
      setSelectedFolderId(EVERYTHING_ID);
    }
  }, [folders, selectedFolderId]);

  const currentLinks = selectedFolderId === EVERYTHING_ID || !selectedFolderId
    ? links
    : links.filter((l) => l.folder_id === selectedFolderId);

  const folderIdForNewLinks = selectedFolderId === EVERYTHING_ID || !selectedFolderId
    ? (folders.find((f) => f.name === PURGATORY_NAME) ?? folders[0])?.id ?? null
    : selectedFolderId;

  const onLinkAdded = (link: LinkType) => setLinks((prev) => [link, ...prev]);
  const onMoveLink = (linkId: string, folderId: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, folder_id: folderId } : l))
    );
  };
  const onLinkUpdated = (linkId: string, title: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, title } : l))
    );
  };
  const onLinkRemoved = (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  };
  const onLinksReordered = (folderId: string, linkIds: string[]) => {
    setLinks((prev) => {
      const inFolder = prev.filter((l) => l.folder_id === folderId);
      const orderMap = new Map(linkIds.map((id, i) => [id, i]));
      inFolder.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      const others = prev.filter((l) => l.folder_id !== folderId);
      return [...others, ...inFolder];
    });
  };

  const onFoldersChange = (next: Folder[]) => setFolders(next);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <FolderSidebar
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onMoveLink={onMoveLink}
            onFoldersChange={onFoldersChange}
            everythingId={EVERYTHING_ID}
          />
          <main className="flex-1 flex flex-col min-h-0 p-4 md:p-6 overflow-auto">
            <AddLinkForm
              currentFolderId={folderIdForNewLinks}
              onLinkAdded={onLinkAdded}
              folders={folders}
            />
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-moo-brown">Loading…</div>
            ) : (
              <LinkGrid
                links={currentLinks}
                folderId={selectedFolderId !== EVERYTHING_ID ? selectedFolderId : null}
                onMoveLink={onMoveLink}
                onReorder={onLinksReordered}
                onLinkUpdated={onLinkUpdated}
                onLinkRemoved={onLinkRemoved}
                folders={folders}
              />
            )}
          </main>
        </div>
      </div>
    </DndProvider>
  );
}
