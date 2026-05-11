"use client";

import type { FridgeLink, ShelfTab } from "@/types/linkfridge";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { IconLinkSliders, IconShare, IconTrash } from "./icons";

const DRAG_GHOST_SCALE = 0.5;

function attachScaledDragGhost(e: DragEvent<HTMLDivElement>, sourceEl: HTMLDivElement): void {
  const srcW = sourceEl.offsetWidth;
  const srcH = sourceEl.offsetHeight;
  if (srcW < 8 || srcH < 8) return;

  const w = Math.max(72, Math.round(srcW * DRAG_GHOST_SCALE));
  const h = Math.max(56, Math.round(srcH * DRAG_GHOST_SCALE));

  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-linkfridge-drag-ghost", "");
  wrapper.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "pointer-events:none",
    "z-index:2147483646",
    `width:${w}px`,
    `height:${h}px`,
    "overflow:hidden",
    "border-radius:14px",
    "box-shadow:0 14px 32px rgba(0,0,0,0.2)",
    "opacity:0.96",
  ].join(";");

  const inner = sourceEl.cloneNode(true) as HTMLDivElement;
  inner.style.transformOrigin = "top left";
  inner.style.transform = `scale(${DRAG_GHOST_SCALE})`;
  inner.style.width = `${srcW}px`;
  inner.style.height = `${srcH}px`;
  wrapper.appendChild(inner);
  document.body.appendChild(wrapper);

  void wrapper.offsetWidth;
  try {
    e.dataTransfer.setDragImage(wrapper, Math.round(w / 2), Math.round(h / 2));
  } catch {
    wrapper.remove();
    return;
  }

  const remove = () => {
    wrapper.remove();
    window.removeEventListener("dragend", remove);
  };
  window.addEventListener("dragend", remove);
}

type Props = {
  link: FridgeLink;
  onEdit?: (link: FridgeLink) => void;
  onDelete?: (link: FridgeLink) => void | Promise<void>;
  /** When set, the whole card can be dragged to freezer / fridge shelves. */
  dragSource?: ShelfTab | null;
};

export function FridgeLinkCard({ link, onEdit, onDelete, dragSource = null }: Props) {
  const draggable = dragSource != null;
  const rootRef = useRef<HTMLDivElement | null>(null);
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
      ref={rootRef}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("application/json", JSON.stringify({ linkId: link.id, from: dragSource }));
        e.dataTransfer.effectAllowed = "move";
        const el = rootRef.current;
        if (el) attachScaledDragGhost(e, el);
      }}
      className={`relative group h-full min-h-0 rounded-2xl overflow-hidden bg-white shadow-apple hover:shadow-apple-lg border border-black/5 transition-all duration-200 ${
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
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(link);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white/95 text-moo-dark opacity-0 shadow-ios-icon backdrop-blur-sm transition-opacity hover:border-black/12 hover:bg-white hover:text-moo-accent group-hover:opacity-100"
            aria-label="Edit link"
            title="Edit"
          >
            <IconLinkSliders className="shrink-0" />
          </button>
        ) : null}
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void onDelete(link);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-200/90 bg-red-50/95 text-red-700 opacity-0 shadow-ios-icon backdrop-blur-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
          aria-label="Delete link"
          title="Delete"
        >
          <IconTrash className="h-[17px] w-[17px] shrink-0 opacity-90" />
        </button>
      ) : null}
    </div>
  );
}
