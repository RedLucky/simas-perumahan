export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { expenseCategoryValues } from "@/lib/validators/expenses";
import { PengeluaranAdminClient } from "./ui";

type ExpenseRow = {
  id: string;
  category: (typeof expenseCategoryValues)[number];
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
  created_by_name_snapshot: string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function endOfMonth(monthInput: string) {
  const monthStart = `${monthInput}-01`;
  const date = new Date(`${monthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export default async function AdminPengeluaranPage() {
  const month = currentMonth();
  const start = `${month}-01`;
  const end = endOfMonth(month);

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("expenses")
    .select("id, category, amount, expense_date, note, created_at, created_by_name_snapshot")
    .gte("expense_date", start)
    .lte("expense_date", end)
    .order("expense_date", { ascending: false })
    .limit(300);

  const initialRows: ExpenseRow[] = (rows ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    expense_date: row.expense_date,
    note: row.note,
    created_at: row.created_at,
    created_by_name_snapshot: row.created_by_name_snapshot,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Input Pengeluaran</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Catat pengeluaran operasional RT dan pantau riwayat transaksi per periode.
      </p>
      <PengeluaranAdminClient initialRows={initialRows} initialMonth={month} />
    </main>
  );
}
