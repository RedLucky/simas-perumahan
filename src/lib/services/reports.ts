import type { SupabaseClient } from "@supabase/supabase-js";

const SATPAM_CATEGORIES = ["GAJI_SATPAM_FULLTIME", "GAJI_SATPAM_MINGGU"] as const;
const SAMPAH_CATEGORIES = ["GAJI_TUKANG_SAMPAH"] as const;

type ReportMonth = `${number}-${string}`;

export function normalizeMonth(month: string | null): ReportMonth {
  const fallback = new Date().toISOString().slice(0, 7) as ReportMonth;
  if (!month) return fallback;
  if (/^\d{4}-\d{2}$/.test(month)) return month as ReportMonth;
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month.slice(0, 7) as ReportMonth;
  return fallback;
}

export function monthRange(month: ReportMonth) {
  const start = `${month}-01`;
  const endDate = new Date(`${start}T00:00:00Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  endDate.setUTCDate(0);
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

export function normalizeYear(yearRaw: string | null): number {
  const current = new Date().getUTCFullYear();
  const parsed = Number(yearRaw ?? current);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) return current;
  return parsed;
}

export async function getMonthlyRecap(supabase: SupabaseClient, month: string | null) {
  const normalized = normalizeMonth(month);
  const { start, end } = monthRange(normalized);

  const [{ data: duesRows, error: duesError }, { data: incidentalRows, error: incidentalError }, { data: expensesRows, error: expensesError }, { data: cashRows, error: cashError }] =
    await Promise.all([
      supabase.from("monthly_dues_payments").select("paid_amount").eq("month_key", start),
      supabase.from("incidental_payments").select("paid_amount").gte("paid_at", start).lte("paid_at", end),
      supabase.from("expenses").select("category, amount").gte("expense_date", start).lte("expense_date", end),
      supabase.from("cash_summary").select("current_balance").single(),
    ]);

  if (duesError || incidentalError || expensesError || cashError) {
    throw new Error(
      duesError?.message ?? incidentalError?.message ?? expensesError?.message ?? cashError?.message ?? "Failed monthly recap",
    );
  }

  const duesIncome = (duesRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);
  const incidentalIncome = (incidentalRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);

  const expenseByCategory = new Map<string, number>();
  for (const row of expensesRows ?? []) {
    const key = String(row.category);
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + Number(row.amount ?? 0));
  }

  const totalExpenses = Array.from(expenseByCategory.values()).reduce((a, b) => a + b, 0);

  return {
    month: normalized,
    income: {
      dues: duesIncome,
      incidental: incidentalIncome,
      total: duesIncome + incidentalIncome,
    },
    expenses: {
      total: totalExpenses,
      byCategory: Array.from(expenseByCategory.entries()).map(([category, amount]) => ({ category, amount })),
    },
    endingBalance: Number(cashRows?.current_balance ?? 0),
  };
}

export async function getArrearsReport(supabase: SupabaseClient, month: string | null) {
  const normalized = normalizeMonth(month);
  const monthKey = `${normalized}-01`;

  const { data, error } = await supabase
    .from("monthly_dues_arrears_by_house")
    .select("house_id, code, display_name, month_key, arrears_balance, payment_status")
    .eq("month_key", monthKey)
    .order("arrears_balance", { ascending: false });

  if (error) throw new Error(error.message);

  return {
    month: normalized,
    rows: (data ?? []).map((row) => ({
      houseId: row.house_id,
      code: row.code,
      displayName: row.display_name,
      arrearsBalance: Number(row.arrears_balance ?? 0),
      paymentStatus: row.payment_status,
    })),
  };
}

export async function getStaffSalaryReport(
  supabase: SupabaseClient,
  fromRaw: string | null,
  toRaw: string | null,
) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);

  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromRaw ?? "") ? (fromRaw as string) : defaultFrom;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(toRaw ?? "") ? (toRaw as string) : defaultTo;

  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, amount, expense_date, note, created_by_name_snapshot")
    .in("category", [...SATPAM_CATEGORIES, ...SAMPAH_CATEGORIES])
    .gte("expense_date", from)
    .lte("expense_date", to)
    .order("expense_date", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount ?? 0),
    expenseDate: row.expense_date,
    note: row.note,
    createdBy: row.created_by_name_snapshot,
  }));

  const totals = rows.reduce(
    (acc, row) => {
      if (SATPAM_CATEGORIES.includes(row.category as (typeof SATPAM_CATEGORIES)[number])) acc.satpam += row.amount;
      if (SAMPAH_CATEGORIES.includes(row.category as (typeof SAMPAH_CATEGORIES)[number])) acc.sampah += row.amount;
      return acc;
    },
    { satpam: 0, sampah: 0 },
  );

  return {
    period: { from, to },
    totals: {
      satpam: totals.satpam,
      sampah: totals.sampah,
      total: totals.satpam + totals.sampah,
    },
    rows,
  };
}

export async function getYearlyBalanceReport(supabase: SupabaseClient, yearRaw: string | null) {
  const year = normalizeYear(yearRaw);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const [{ data: duesRows, error: duesError }, { data: incidentalRows, error: incidentalError }, { data: expenseRows, error: expenseError }] =
    await Promise.all([
      supabase.from("monthly_dues_payments").select("paid_amount").gte("paid_at", from).lte("paid_at", to),
      supabase.from("incidental_payments").select("paid_amount").gte("paid_at", from).lte("paid_at", to),
      supabase.from("expenses").select("amount").gte("expense_date", from).lte("expense_date", to),
    ]);

  if (duesError || incidentalError || expenseError) {
    throw new Error(duesError?.message ?? incidentalError?.message ?? expenseError?.message ?? "Failed yearly balance");
  }

  const duesIncome = (duesRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);
  const incidentalIncome = (incidentalRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);
  const totalExpense = (expenseRows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

  return {
    year,
    income: {
      dues: duesIncome,
      incidental: incidentalIncome,
      total: duesIncome + incidentalIncome,
    },
    expense: {
      total: totalExpense,
    },
    net: duesIncome + incidentalIncome - totalExpense,
  };
}
