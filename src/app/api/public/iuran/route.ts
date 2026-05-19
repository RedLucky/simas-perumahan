import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeMonthParam(month: string | null): string {
  if (!month) return new Date().toISOString().slice(0, 7) + "-01";
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
  return month;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const monthKey = normalizeMonthParam(url.searchParams.get("month"));

  const { data, error } = await supabase
    .from("monthly_dues_arrears_by_house")
    .select("house_id, code, display_name, order_number, month_key, due_in_month, paid_in_month, arrears_balance, payment_status")
    .eq("month_key", monthKey)
    .order("order_number", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const summary = (data ?? []).reduce(
    (acc, row) => {
      acc.totalDue += Number(row.due_in_month ?? 0);
      acc.totalPaid += Number(row.paid_in_month ?? 0);
      acc.totalArrears += Number(row.arrears_balance ?? 0);
      return acc;
    },
    { totalDue: 0, totalPaid: 0, totalArrears: 0 },
  );

  return NextResponse.json({
    ok: true,
    data: {
      monthKey,
      summary,
      rows: data ?? [],
    },
  });
}
