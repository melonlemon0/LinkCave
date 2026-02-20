import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const FETCH_OPTIONS = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0 (link preview)",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
  },
  signal: AbortSignal.timeout(8000),
};

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam || !isValidUrl(urlParam)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const url = normalizeUrl(urlParam);
  try {
    // YouTube (videos + Shorts) and youtu.be: oEmbed for reliable title + thumbnail
    if (isYouTube(url)) {
      const result = await fetchYouTubeMetadata(url);
      if (result) return NextResponse.json(result);
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

async function fetchYouTubeMetadata(
  url: string
): Promise<{ title: string; thumbnail_url: string | null } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      ...FETCH_OPTIONS,
      headers: { ...FETCH_OPTIONS.headers, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };
    const title = (data.title ?? new URL(url).hostname).trim().slice(0, 200);
    const thumbnail_url = data.thumbnail_url ?? null;
    return { title: title || "YouTube", thumbnail_url };
  } catch {
    return null;
  }
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
    const html = await res.text();
    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "Apple Music";
    const thumbnail =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;
    const thumbnail_url = thumbnail ? new URL(thumbnail, url).href : null;
    return {
      title: title.trim().slice(0, 200) || "Apple Music",
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
  const html = await res.text();
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    new URL(url).hostname;
  const thumbnail =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;
  const absoluteThumb = thumbnail ? new URL(thumbnail, url).href : null;
  return {
    title: title.trim().slice(0, 200) || "Link",
    thumbnail_url: absoluteThumb,
  };
}
