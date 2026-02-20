"use client";

import React from "react";
import { useDrag } from "react-dnd";
import Image from "next/image";
import type { Link } from "@/types/db";

const LINK_TYPE = "link";

type Props = {
  link: Link;
  onEdit?: (link: Link) => void;
};

export function LinkCard({ link, onEdit }: Props) {
  const [{ isDragging }, drag] = useDrag({
    type: LINK_TYPE,
    item: { linkId: link.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`relative group rounded-2xl overflow-hidden bg-white shadow-apple hover:shadow-apple-lg border border-black/5 transition-all duration-200
        ${isDragging ? "link-card-dragging cursor-grabbing" : "cursor-grab active:cursor-grabbing"}
      `}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="aspect-video relative bg-gray-100">
          {link.thumbnail_url ? (
            <Image
              src={link.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
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
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(link);
          }}
          className="absolute top-1.5 right-1.5 w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
          aria-label="Edit link"
        >
          ✏️
        </button>
      )}
    </div>
  );
}
