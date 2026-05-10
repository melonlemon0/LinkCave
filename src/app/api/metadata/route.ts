import { NextRequest, NextResponse } from "next/server";

const FETCH_OPTIONS = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0 (link preview)",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
  },
  signal: AbortSignal.timeout(22_000),
};

/** OG tags are almost always in the head; cap size so huge pages don’t stall regex work. */
const HTML_META_PREFIX_CHARS = 900_000;

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam || !isValidUrl(urlParam)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const url = normalizeUrl(urlParam);
  try {
    // YouTube (videos + Shorts) and youtu.be: oEmbed for reliable title + thumbnail
    if (isYouTube(url)) {
      return NextResponse.json(await fetchYouTubeMetadata(url));
    }
    // Spotify: oEmbed
    if (isSpotify(url)) {
      const result = await fetchSpotifyMetadata(url);
      if (result) return NextResponse.json(result);
    }
    // Apple Music: fetch HTML (has good og tags)
    if (isAppleMusic(url)) {
      const result = await fetchAppleMusicMetadata(url);
      if (result) return NextResponse.json(result);
    }
    // Instagram, Naver blog, and everything else: fetch HTML and parse og:title / og:image
    const result = await fetchHtmlMetadata(url);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Metadata fetch error:", e);
    return NextResponse.json(
      { title: new URL(url).hostname, thumbnail_url: null },
      { status: 200 }
    );
  }
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(s: string): string {
  try {
    const u = new URL(s);
    // youtu.be/ID -> watch?v=ID
    if (u.hostname === "youtu.be" && u.pathname.length > 1) {
      const id = u.pathname.slice(1).split("/")[0].split("?")[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }
    // youtube.com/shorts/ID -> watch?v=ID (oEmbed works with watch format)
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "m.youtube.com") &&
      u.pathname.startsWith("/shorts/")
    ) {
      const id = u.pathname.replace(/^\/shorts\//, "").split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    return u.href;
  } catch {
    return s;
  }
}

function isYouTube(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com" ||
      u.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

function isSpotify(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "open.spotify.com" || u.hostname === "spotify.com"
    );
  } catch {
    return false;
  }
}

function isAppleMusic(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "music.apple.com" ||
      u.hostname.endsWith(".music.apple.com") ||
      (u.hostname === "apple.co" && u.pathname.startsWith("/"))
    );
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{6,}$/.test(v)) return v;
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function youtubeThumbnailFallback(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function fetchYouTubeMetadata(url: string): Promise<{ title: string; thumbnail_url: string | null }> {
  const id = extractYouTubeVideoId(url);
  const thumbFallback = id ? youtubeThumbnailFallback(id) : null;
  const titleHost = new URL(url).hostname;
  const titleFallback = id ? "YouTube" : titleHost;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      ...FETCH_OPTIONS,
      headers: { ...FETCH_OPTIONS.headers, Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        thumbnail_url?: string;
      };
      const title = (data.title ?? titleFallback).trim().slice(0, 200);
      const thumbnail_url = (data.thumbnail_url?.trim() || thumbFallback) ?? null;
      return { title: title || titleFallback, thumbnail_url };
    }
  } catch {
    /* use static thumbnail when oEmbed is rate-limited or unreachable */
  }

  if (id && thumbFallback) {
    return { title: titleFallback, thumbnail_url: thumbFallback };
  }
  return { title: titleHost, thumbnail_url: null };
}

async function fetchSpotifyMetadata(
  url: string
): Promise<{ title: string; thumbnail_url: string | null } | null> {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      ...FETCH_OPTIONS,
      headers: { ...FETCH_OPTIONS.headers, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };
    const title = (data.title ?? "Spotify").trim().slice(0, 200);
    const thumbnail_url = data.thumbnail_url ?? null;
    return { title: title || "Spotify", thumbnail_url };
  } catch {
    return null;
  }
}

async function fetchAppleMusicMetadata(
  url: string
): Promise<{ title: string; thumbnail_url: string | null } | null> {
  try {
    const res = await fetch(url, FETCH_OPTIONS);
    if (!res.ok) return null;
    const html = htmlForMetaParse(await res.text());
    const titleRaw =
      extractMetaContent(html, "property", "og:title") ||
      extractTagText(html, "title") ||
      "Apple Music";
    const thumbnail_url = pickOgImage(html, url);
    return {
      title: sanitizePreviewText(titleRaw, "Apple Music"),
      thumbnail_url,
    };
  } catch {
    return null;
  }
}

async function fetchHtmlMetadata(
  url: string
): Promise<{ title: string; thumbnail_url: string | null }> {
  const res = await fetch(url, FETCH_OPTIONS);
  if (!res.ok) throw new Error("Fetch failed");
  const html = htmlForMetaParse(await res.text());
  const host = new URL(url).hostname;
  const titleRaw =
    extractMetaContent(html, "property", "og:title") ||
    extractMetaContent(html, "name", "twitter:title") ||
    extractTagText(html, "title") ||
    host;
  const thumbnail_url = pickOgImage(html, url);
  return {
    title: sanitizePreviewText(titleRaw, host),
    thumbnail_url,
  };
}

function htmlForMetaParse(full: string): string {
  if (full.length <= HTML_META_PREFIX_CHARS) return full;
  return full.slice(0, HTML_META_PREFIX_CHARS);
}

function decodeHtmlEntities(raw: string): string {
  if (!raw.includes("&")) return raw;
  let s = raw;
  s = s.replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => {
    const cp = parseInt(hex, 16);
    if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return match;
    try {
      return String.fromCodePoint(cp);
    } catch {
      return match;
    }
  });
  s = s.replace(/&#(\d+);/g, (match, dec: string) => {
    const cp = parseInt(dec, 10);
    if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return match;
    try {
      return String.fromCodePoint(cp);
    } catch {
      return match;
    }
  });
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&apos;/gi, "'");
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  return s;
}

function sanitizePreviewText(raw: string, fallback: string): string {
  const t = decodeHtmlEntities(raw).replace(/\s+/g, " ").trim().slice(0, 200);
  return t || fallback;
}

function pickOgImage(html: string, baseUrl: string): string | null {
  const raw =
    extractMetaContent(html, "property", "og:image:secure_url") ||
    extractMetaContent(html, "property", "og:image:url") ||
    extractMetaContent(html, "property", "og:image") ||
    extractMetaContent(html, "name", "twitter:image:src") ||
    extractMetaContent(html, "name", "twitter:image") ||
    extractMetaContent(html, "property", "twitter:image") ||
    null;
  if (!raw) return null;
  const decoded = decodeHtmlEntities(raw.trim());
  try {
    return new URL(decoded, baseUrl).href;
  } catch {
    return null;
  }
}

function extractMetaContent(
  html: string,
  attr: "name" | "property",
  value: string
): string | null {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<meta[^>]*${attr}\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reverseRegex = new RegExp(
    `<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*${attr}\\s*=\\s*["']${escaped}["'][^>]*>`,
    "i"
  );
  return regex.exec(html)?.[1]?.trim() || reverseRegex.exec(html)?.[1]?.trim() || null;
}

function extractTagText(html: string, tagName: "title"): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return regex.exec(html)?.[1]?.replace(/\s+/g, " ").trim() || null;
}
