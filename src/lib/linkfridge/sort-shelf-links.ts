import type { FridgeLink } from "@/types/linkfridge";

/** Pinned links first, then newest by `createdAt`. */
export function compareActiveShelf(a: FridgeLink, b: FridgeLink): number {
  const pa = a.pinned ? 1 : 0;
  const pb = b.pinned ? 1 : 0;
  if (pa !== pb) return pb - pa;
  return b.createdAt - a.createdAt;
}

/** Pinned links first, then newest by `frozenAt`. */
export function compareFrozenShelf(a: FridgeLink, b: FridgeLink): number {
  const pa = a.pinned ? 1 : 0;
  const pb = b.pinned ? 1 : 0;
  if (pa !== pb) return pb - pa;
  return (b.frozenAt ?? 0) - (a.frozenAt ?? 0);
}

export function sortActiveShelfLinks(links: FridgeLink[]): FridgeLink[] {
  return [...links].sort(compareActiveShelf);
}

export function sortFrozenShelfLinks(links: FridgeLink[]): FridgeLink[] {
  return [...links].sort(compareFrozenShelf);
}
