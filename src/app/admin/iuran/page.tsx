export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IuranAdminClient } from "./ui";

type House = { id: string; code: string; display_name: string };
type PaymentRow = {
  id: string;
  month_key: string;
  paid_amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
  created_by_name_snapshot: string;
  houses: { code: string; display_name: string };
};

function currentMonthStart(): string {
  return new Date().toISOString().slice(0, 7) + "-01";
}

export default async function AdminIuranPage() {
  const supabase = await createSupabaseServerClient();
  const monthKey = currentMonthStart();

  const [{ data: houses }, { data: history }] = await Promise.all([
    supabase
      .from("houses")
      .select("id, code, display_name")
      .eq("is_active", true)
      .order("code", { ascending: true }),
    supabase
      .from("monthly_dues_payments")
      .select(
        "id, month_key, paid_amount, paid_at, note, created_at, created_by_name_snapshot, houses!inner(code, display_name)",
      )
      .eq("month_key", monthKey)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const normalizedHistory: PaymentRow[] = (history ?? []).map((row) => ({
    id: row.id,
    month_key: row.month_key,
    paid_amount: Number(row.paid_amount),
    paid_at: row.paid_at,
    note: row.note,
    created_at: row.created_at,
    created_by_name_snapshot: row.created_by_name_snapshot,
    houses: Array.isArray(row.houses) ? row.houses[0] : row.houses,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Input Iuran Bulanan</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Input pembayaran iuran per rumah, lalu tinjau riwayat transaksi per bulan.
      </p>
      <IuranAdminClient
        initialHouses={(houses ?? []) as House[]}
        initialHistory={normalizedHistory}
        initialMonthKey={monthKey}
      />
    </main>
  );
}
