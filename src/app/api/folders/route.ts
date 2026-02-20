import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, emoji, sort_order } = body as { name?: string; emoji?: string; sort_order?: number };
  const nameStr = typeof name === "string" ? name.trim() : "";

  const { count } = await supabase
    .from("folders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count != null && count >= 5) {
    return NextResponse.json({ error: "Maximum 5 folders allowed" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name: nameStr,
      emoji: typeof emoji === "string" ? emoji : "📁",
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
