import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** Ensure we store a single URL (e.g. avoid duplicated paste). For YouTube Shorts, return canonical watch URL. */
function normalizeLinkUrl(url: string): string {
  const firstLine = url.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return url;
  try {
    let single = firstLine;
    if (firstLine.includes("https://") || firstLine.includes("http://")) {
      const protocol = firstLine.startsWith("https://") ? "https://" : firstLine.startsWith("http://") ? "http://" : null;
      if (protocol) {
        const rest = firstLine.slice(protocol.length);
        const next = Math.min(
          rest.indexOf("https://") === -1 ? 1e9 : rest.indexOf("https://"),
          rest.indexOf("http://") === -1 ? 1e9 : rest.indexOf("http://")
        );
        single = next > 0 && next < 1e9 ? protocol + rest.slice(0, next) : firstLine;
      }
    }
    const u = new URL(single);
    if ((u.hostname === "youtu.be" || u.hostname.includes("youtube.com")) && u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.replace(/^\/shorts\//, "").split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    if (u.hostname === "youtu.be" && u.pathname.length > 1) {
      const id = u.pathname.slice(1).split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    return single;
  } catch {
    return firstLine;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { folder_id, url, title, thumbnail_url } = body as {
    folder_id: string;
    url: string;
    title: string;
    thumbnail_url?: string | null;
  };
  if (!folder_id || !url || !title) {
    return NextResponse.json({ error: "folder_id, url, and title are required" }, { status: 400 });
  }

  const normalizedUrl = normalizeLinkUrl(url);

  const { data, error } = await supabase
    .from("links")
    .insert({
      user_id: user.id,
      folder_id,
      url: normalizedUrl,
      title,
      thumbnail_url: thumbnail_url ?? null,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
