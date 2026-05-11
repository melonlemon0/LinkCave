import { getSingleUrl, normalizeLinkUrl } from "./url-helpers";

export type LinkPreviewResult = {
  url: string;
  title: string;
  thumbnailUrl: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolve title + thumbnail for a pasted URL string (may include noise). */
export async function fetchLinkPreview(rawInput: string): Promise<LinkPreviewResult> {
  const raw = getSingleUrl(rawInput);
  if (!raw) throw new Error("No link found in clipboard.");
  let title: string;
  try {
    title = new URL(raw).hostname;
  } catch {
    throw new Error("Clipboard does not look like a valid URL.");
  }
  let thumbnailUrl: string | null = null;
  const hostname = title;

  /** One round-trip can be slow (HTML fetch on the server); user prefers correct preview over speed. */
  const METADATA_TIMEOUT_MS = 32_000;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let fetchFailed = false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
      try {
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(raw)}`, {
          signal: controller.signal,
        });
        if (metaRes.ok) {
          const data = (await metaRes.json()) as { title?: string; thumbnail_url?: string | null };
          const t = typeof data.title === "string" ? data.title.trim() : "";
          if (t) title = t;
          if (typeof data.thumbnail_url === "string" && data.thumbnail_url.trim() !== "") {
            thumbnailUrl = data.thumbnail_url.trim();
          } else if (data.thumbnail_url === null) {
            thumbnailUrl = null;
          }
        } else {
          fetchFailed = true;
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      fetchFailed = true;
    }

    /** Retry when we still only have the hostname as title — og:image can succeed while title meta is missed. */
    const titleStillFallback = title === hostname;
    const looksBare = thumbnailUrl === null && titleStillFallback;
    const needBetterTitle = titleStillFallback && thumbnailUrl !== null;
    if (!looksBare && !needBetterTitle && !fetchFailed) break;
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(650 + attempt * 450);
    }
  }

  return {
    url: normalizeLinkUrl(raw),
    title,
    thumbnailUrl,
  };
}
