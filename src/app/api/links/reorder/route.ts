import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { folder_id, link_ids } = body as { folder_id: string; link_ids: string[] };
  if (!folder_id || !Array.isArray(link_ids) || link_ids.length === 0) {
    return NextResponse.json({ error: "folder_id and link_ids required" }, { status: 400 });
  }

  for (let i = 0; i < link_ids.length; i++) {
    const { error } = await supabase
      .from("links")
      .update({ sort_order: i })
      .eq("id", link_ids[i])
      .eq("user_id", user.id)
      .eq("folder_id", folder_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
