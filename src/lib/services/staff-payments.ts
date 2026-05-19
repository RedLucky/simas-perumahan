import type { SupabaseClient } from "@supabase/supabase-js";

const SATPAM_CATEGORIES = ["GAJI_SATPAM_FULLTIME", "GAJI_SATPAM_MINGGU"] as const;
const SAMPAH_CATEGORIES = ["GAJI_TUKANG_SAMPAH"] as const;

function currentMonthRange() {
  const start = new Date();
  const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));

  return {
    start: first.toISOString().slice(0, 10),
    end: last.toISOString().slice(0, 10),
  };
}

export async function getCurrentMonthStaffPaymentSummary(supabase: SupabaseClient) {
  const { start, end } = currentMonthRange();

  const [{ data: satpamRows, error: satpamError }, { data: sampahRows, error: sampahError }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("amount")
        .in("category", [...SATPAM_CATEGORIES])
        .gte("expense_date", start)
        .lte("expense_date", end),
      supabase
        .from("expenses")
        .select("amount")
        .in("category", [...SAMPAH_CATEGORIES])
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);

  if (satpamError || sampahError) {
    const message = satpamError?.message ?? sampahError?.message ?? "Failed fetching staff payment summary";
    throw new Error(message);
  }

  const satpamTotal = (satpamRows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);
  const sampahTotal = (sampahRows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0);

  return {
    periodStart: start,
    periodEnd: end,
    satpamTotal,
    sampahTotal,
  };
}
