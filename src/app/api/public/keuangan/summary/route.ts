import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeMonthParam(month: string | null): string {
  if (!month) return new Date().toISOString().slice(0, 7) + "-01";
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
  return month;
}

function endOfMonth(monthStart: string) {
  const date = new Date(`${monthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const monthKey = normalizeMonthParam(url.searchParams.get("month"));
  const monthEnd = endOfMonth(monthKey);

  const [{ data: cashSummary, error: cashError }, { data: monthlyIncomeRows, error: incomeError }, { data: monthlyExpensesRows, error: expensesError }] =
    await Promise.all([
      supabase.from("cash_summary").select("total_monthly_dues, total_incidental_income, total_expenses, current_balance").single(),
      supabase
        .from("monthly_dues_payments")
        .select("paid_amount")
        .gte("month_key", monthKey)
        .lte("month_key", monthKey),
      supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", monthKey)
        .lte("expense_date", monthEnd),
    ]);

  if (cashError || incomeError || expensesError) {
    const message = cashError?.message ?? incomeError?.message ?? expensesError?.message ?? "Failed fetching cash summary";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }

  const monthlyDuesIncome = (monthlyIncomeRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);
  const monthlyExpenses = (monthlyExpensesRows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

  return NextResponse.json({
    ok: true,
    data: {
      monthKey,
      overall: {
        totalMonthlyDues: Number(cashSummary?.total_monthly_dues ?? 0),
        totalIncidentalIncome: Number(cashSummary?.total_incidental_income ?? 0),
        totalExpenses: Number(cashSummary?.total_expenses ?? 0),
        currentBalance: Number(cashSummary?.current_balance ?? 0),
      },
      monthly: {
        duesIncome: monthlyDuesIncome,
        expenses: monthlyExpenses,
        net: monthlyDuesIncome - monthlyExpenses,
      },
    },
  });
}
