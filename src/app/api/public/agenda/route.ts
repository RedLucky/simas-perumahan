import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("agenda_posts")
    .select("id, title, content, event_date, location, category, is_published, created_at")
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data: { rows: data ?? [] } });
}
