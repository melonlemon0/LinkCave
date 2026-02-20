import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await _request.json();
  const { title, thumbnail_url } = body as { title?: string; thumbnail_url?: string | null };
  const updates: { title?: string; thumbnail_url?: string | null } = {};
  if (typeof title === "string" && title.trim()) updates.title = title.trim().slice(0, 500);
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url === null || thumbnail_url === "" ? null : String(thumbnail_url).slice(0, 2000);
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "title or thumbnail_url required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
