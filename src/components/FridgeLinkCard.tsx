"use client";

import type { FridgeLink, ShelfTab } from "@/types/linkfridge";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconShare, IconLinkSliders } from "./icons";

type Props = {
  link: FridgeLink;
  onEdit?: (link: FridgeLink) => void;
  /** Fridge / freezer: pin to top of the grid. */
  onTogglePin?: (link: FridgeLink) => void | Promise<void>;
  /** When set, the whole card can be dragged to Freezer / Trash / Fridge shelves. */
  dragSource?: ShelfTab | null;
};

export function FridgeLinkCard({ link, onEdit, onTogglePin, dragSource = null }: Props) {
  const draggable = dragSource != null;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyUrl = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(link.url);
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore — permission or unsupported */
      }
    },
    [link.url]
  );

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("application/json", JSON.stringify({ linkId: link.id, from: dragSource }));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`relative group rounded-2xl overflow-hidden bg-white shadow-apple hover:shadow-apple-lg border border-black/5 transition-all duration-200 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <a href={link.url} target="_blank" rel="noopener noreferrer" draggable={false} className="block">
        <div className="aspect-video relative bg-gray-100">
          {link.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary OG URLs from metadata API
            <img
              src={link.thumbnailUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
              🔗
            </div>
          )}
        </div>
        <p className="p-3 text-sm font-medium text-moo-dark truncate" title={link.title}>
          {link.title}
        </p>
      </a>
      <div className="absolute left-2 top-2 z-10 flex items-start gap-1">
        {onTogglePin && (dragSource === "fridge" || dragSource === "freezer") ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onTogglePin(link);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff176] shadow-ios-icon transition-opacity hover:bg-[#ffec85] ${
              link.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            aria-label={link.pinned ? "Unpin from top" : "Pin to top of shelf"}
            title={link.pinned ? "Unpin" : "Pin to top"}
          >
            <span className="select-none text-[1.05rem] leading-none" aria-hidden>
              📍
            </span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={copyUrl}
          onMouseDown={(e) => e.stopPropagation()}
          className={`flex items-center justify-center border border-black/[0.08] bg-white/95 shadow-ios-icon backdrop-blur-sm transition-opacity hover:border-black/12 hover:bg-white hover:text-moo-accent ${
            copied
              ? "min-h-8 min-w-[4.75rem] rounded-xl px-2 py-1.5 text-emerald-600 opacity-100"
              : "h-8 w-8 rounded-full text-moo-dark opacity-0 group-hover:opacity-100"
          }`}
          aria-label={copied ? "Copied!" : "Share — copy link to clipboard"}
          title={copied ? "Copied!" : "Share (copy link)"}
        >
          {copied ? (
            <span className="text-[11px] font-semibold leading-none tracking-tight">Copied!</span>
          ) : (
            <IconShare className="h-[18px] w-[18px] shrink-0" />
          )}
        </button>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(link);
          }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-white/95 text-moo-dark shadow-ios-icon backdrop-blur-sm transition-opacity hover:border-black/12 hover:bg-white hover:text-moo-accent opacity-0 group-hover:opacity-100"
          aria-label="Link options"
          title="Title, reminders, freezer, trash"
        >
          <IconLinkSliders className="shrink-0" />
        </button>
      )}
    </div>
  );
}
