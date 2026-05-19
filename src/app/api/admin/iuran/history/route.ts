import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toMonthStart(month: string | null): string {
  if (!month) return new Date().toISOString().slice(0, 7) + "-01";
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
  return month;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const monthKey = toMonthStart(url.searchParams.get("month"));

  const { data, error } = await supabase
    .from("monthly_dues_payments")
    .select(
      "id, house_id, month_key, paid_amount, paid_at, note, created_at, created_by_name_snapshot, houses!inner(code, display_name)",
    )
    .eq("month_key", monthKey)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { monthKey, rows: data } });
}
