"use client";

import type { FridgeLink } from "@/types/linkfridge";

type Props = {
  link: FridgeLink;
  onEdit?: (link: FridgeLink) => void;
};

export function FridgeLinkCard({ link, onEdit }: Props) {
  return (
    <div className="relative group rounded-2xl overflow-hidden bg-white shadow-apple hover:shadow-apple-lg border border-black/5 transition-all duration-200">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-video relative bg-gray-100">
          {link.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary OG URLs from metadata API
            <img
              src={link.thumbnailUrl}
              alt=""
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
