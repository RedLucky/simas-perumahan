export const dynamic = "force-dynamic";

import Link from "next/link";
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

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  note: string | null;
};

export default async function PublicKeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthKey = normalizeMonthParam(params.month ?? null);
  const monthInput = monthKey.slice(0, 7);
  const monthEnd = endOfMonth(monthKey);

  const supabase = await createSupabaseServerClient();
  const [{ data: cashSummary }, { data: incomeRows }, { data: expenseRowsRaw }] = await Promise.all([
    supabase.from("cash_summary").select("total_monthly_dues, total_incidental_income, total_expenses, current_balance").single(),
    supabase.from("monthly_dues_payments").select("paid_amount").gte("month_key", monthKey).lte("month_key", monthKey),
    supabase
      .from("expenses")
      .select("id, category, amount, expense_date, note")
      .gte("expense_date", monthKey)
      .lte("expense_date", monthEnd)
      .order("expense_date", { ascending: false })
      .limit(200),
  ]);

  const monthlyIncome = (incomeRows ?? []).reduce((acc, row) => acc + Number(row.paid_amount ?? 0), 0);
  const expenseRows: ExpenseRow[] = (expenseRowsRaw ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    expense_date: row.expense_date,
    note: row.note,
  }));
  const monthlyExpenses = expenseRows.reduce((acc, row) => acc + row.amount, 0);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Laporan Keuangan</h1>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Transparansi pemasukan, pengeluaran, dan saldo kas perumahan.</p>
        </div>
        <form action="/keuangan" className="flex items-center gap-2 glass-panel p-2 rounded-xl">
          <input
            type="month"
            name="month"
            defaultValue={monthInput}
            className="rounded-lg border-0 bg-[var(--app-surface-2)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:outline-none"
          />
          <button className="rounded-lg bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95" type="submit">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-[var(--app-accent)] transition-transform hover:-translate-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Saldo Kas Saat Ini</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-accent)]">{toCurrency(Number(cashSummary?.current_balance ?? 0))}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Pemasukan Iuran</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">{toCurrency(Number(cashSummary?.total_monthly_dues ?? 0))}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Pemasukan Insidental</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">{toCurrency(Number(cashSummary?.total_incidental_income ?? 0))}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Total Pengeluaran</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">{toCurrency(Number(cashSummary?.total_expenses ?? 0))}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Pemasukan Terpilih</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toCurrency(monthlyIncome)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1 border-l-4 border-l-rose-500">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Pengeluaran Terpilih</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{toCurrency(monthlyExpenses)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Selisih Terpilih</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{toCurrency(monthlyIncome - monthlyExpenses)}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-sm">
            <thead className="bg-[var(--app-surface-2)]">
              <tr className="text-left text-[var(--app-text-muted)]">
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Nominal</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
              {expenseRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-[var(--app-surface-2)]">
                  <td className="px-4 py-3 text-[var(--app-text)] font-medium">{row.expense_date}</td>
                  <td className="px-4 py-3 text-[var(--app-text)]">
                    <span className="inline-flex rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-2 py-1 text-xs">{row.category}</span>
                  </td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{toCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-[var(--app-text-muted)]">{row.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expenseRows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--app-text-muted)]">Belum ada pengeluaran pada bulan ini.</p>
          </div>
        ) : null}
      </div>

      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
