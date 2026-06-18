import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const currentMonthKey = new Date().toISOString().slice(0, 7) + "-01";

    const [
      { data: cashSummary, error: cashErr },
      { data: arrearsRows, error: arrearsErr },
      { data: duesRate, error: rateErr },
    ] = await Promise.all([
      supabase
        .from("cash_summary")
        .select("total_monthly_dues, total_incidental_income, total_expenses, current_balance")
        .single(),
      supabase
        .from("monthly_dues_arrears_by_house")
        .select("house_id, code, display_name, arrears_balance, payment_status, order_number")
        .eq("month_key", currentMonthKey)
        .order("order_number", { ascending: true }),
      supabase
        .from("dues_rates")
        .select("amount, effective_month")
        .lte("effective_month", currentMonthKey)
        .order("effective_month", { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (cashErr || arrearsErr) {
      throw new Error(cashErr?.message ?? arrearsErr?.message ?? "Failed to fetch dashboard summary");
    }

    const rows = arrearsRows ?? [];
    const totalHouses = rows.length;
    const paidHouses = rows.filter((r) => r.payment_status === "LUNAS").length;
    const partialHouses = rows.filter((r) => r.payment_status === "SEBAGIAN").length;
    const unpaidHouses = totalHouses - paidHouses - partialHouses;
    const totalArrears = rows.reduce((sum, r) => sum + Number(r.arrears_balance ?? 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        cash: {
          balance: Number(cashSummary?.current_balance ?? 0),
          totalDues: Number(cashSummary?.total_monthly_dues ?? 0),
          totalIncidental: Number(cashSummary?.total_incidental_income ?? 0),
          totalExpenses: Number(cashSummary?.total_expenses ?? 0),
        },
        compliance: {
          totalHouses,
          paid: paidHouses,
          partial: partialHouses,
          unpaid: unpaidHouses,
          totalArrears,
          collectionRate: totalHouses > 0 ? Math.round(((paidHouses + partialHouses) / totalHouses) * 100) : 0,
        },
        currentDuesRate: rateErr ? null : Number(duesRate?.amount ?? 0),
        month: currentMonthKey.slice(0, 7),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
